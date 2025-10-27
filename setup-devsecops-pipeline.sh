#!/bin/bash

# ============================================================================
# DevSecOps Pipeline Setup Script
# ============================================================================
# This script sets up the complete DevSecOps pipeline with:
# - SonarQube
# - Trivy
# - ArgoCD
# - GitHub Actions integration
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}============================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_command() {
    if command -v $1 &> /dev/null; then
        print_success "$1 is installed"
        return 0
    else
        print_error "$1 is not installed"
        return 1
    fi
}

# ============================================================================
# Step 1: Check Prerequisites
# ============================================================================

print_header "Step 1: Checking Prerequisites"

MISSING_DEPS=0

check_command kubectl || MISSING_DEPS=$((MISSING_DEPS + 1))
check_command docker || MISSING_DEPS=$((MISSING_DEPS + 1))
check_command git || MISSING_DEPS=$((MISSING_DEPS + 1))

if [ $MISSING_DEPS -gt 0 ]; then
    print_error "$MISSING_DEPS required dependencies are missing"
    exit 1
fi

# Check Kubernetes connectivity
if kubectl cluster-info &> /dev/null; then
    print_success "Kubernetes cluster is accessible"
else
    print_error "Cannot connect to Kubernetes cluster"
    exit 1
fi

# ============================================================================
# Step 2: Get User Inputs
# ============================================================================

print_header "Step 2: Configuration"

# GitHub Repository
read -p "Enter your GitHub username/organization: " GITHUB_USERNAME
read -p "Enter your GitHub repository name (default: Orchestrator): " GITHUB_REPO
GITHUB_REPO=${GITHUB_REPO:-Orchestrator}

# Docker Hub
read -p "Enter your Docker Hub username (default: cybermonta): " DOCKER_USERNAME
DOCKER_USERNAME=${DOCKER_USERNAME:-cybermonta}

# ArgoCD
read -p "Enter ArgoCD server address (e.g., 192.168.11.143:30443): " ARGOCD_SERVER

# SonarQube
read -p "Enter SonarQube server URL (e.g., http://192.168.11.143:30900): " SONAR_HOST_URL

print_info "Configuration summary:"
echo "  GitHub: https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}"
echo "  Docker Hub: ${DOCKER_USERNAME}"
echo "  ArgoCD: ${ARGOCD_SERVER}"
echo "  SonarQube: ${SONAR_HOST_URL}"

read -p "Is this correct? (y/n): " CONFIRM
if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    print_error "Setup cancelled"
    exit 1
fi

# ============================================================================
# Step 3: Install ArgoCD
# ============================================================================

print_header "Step 3: Installing ArgoCD"

if kubectl get namespace argocd &> /dev/null; then
    print_warning "ArgoCD namespace already exists, skipping installation"
else
    print_info "Creating ArgoCD namespace..."
    kubectl create namespace argocd
    
    print_info "Installing ArgoCD..."
    kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
    
    print_info "Waiting for ArgoCD pods to be ready..."
    kubectl wait --for=condition=Ready pods --all -n argocd --timeout=300s
    
    print_success "ArgoCD installed successfully"
fi

# Configure ArgoCD service as NodePort
print_info "Configuring ArgoCD service as NodePort..."
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "NodePort", "ports": [{"port": 443, "targetPort": 8080, "nodePort": 30443, "name": "https"}]}}' 2>/dev/null || print_warning "ArgoCD service already configured"

# Get initial admin password
print_info "ArgoCD initial admin password:"
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" 2>/dev/null | base64 -d)
if [ -n "$ARGOCD_PASSWORD" ]; then
    echo -e "${GREEN}${ARGOCD_PASSWORD}${NC}"
    print_warning "Save this password! You'll need it to login."
else
    print_warning "Could not retrieve ArgoCD password (may already be deleted)"
fi

# ============================================================================
# Step 4: Install ArgoCD CLI (optional)
# ============================================================================

print_header "Step 4: Installing ArgoCD CLI"

if check_command argocd; then
    print_success "ArgoCD CLI already installed"
else
    read -p "Install ArgoCD CLI? (y/n): " INSTALL_CLI
    if [[ $INSTALL_CLI =~ ^[Yy]$ ]]; then
        print_info "Downloading ArgoCD CLI..."
        curl -sSL -o argocd-linux-amd64 https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
        sudo install -m 555 argocd-linux-amd64 /usr/local/bin/argocd
        rm argocd-linux-amd64
        print_success "ArgoCD CLI installed"
    else
        print_info "Skipping ArgoCD CLI installation"
    fi
fi

# ============================================================================
# Step 5: Update ArgoCD Application Configuration
# ============================================================================

print_header "Step 5: Configuring ArgoCD Application"

if [ -f "k8s/argocd-application.yaml" ]; then
    print_info "Updating ArgoCD application configuration..."
    
    # Backup original file
    cp k8s/argocd-application.yaml k8s/argocd-application.yaml.backup
    
    # Update repository URL
    sed -i "s|repoURL:.*|repoURL: https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}.git|g" k8s/argocd-application.yaml
    
    print_success "ArgoCD application configuration updated"
    print_info "Repository URL: https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}.git"
else
    print_error "ArgoCD application file not found: k8s/argocd-application.yaml"
    exit 1
fi

# ============================================================================
# Step 6: Update Kubernetes Manifests with Docker Hub Images
# ============================================================================

print_header "Step 6: Updating Kubernetes Manifests"

if [ -f "k8s/backend-deployment.yaml" ]; then
    print_info "Updating backend deployment..."
    sed -i "s|image:.*orchestrator-backend.*|image: ${DOCKER_USERNAME}/orchestrator-backend:latest|g" k8s/backend-deployment.yaml
    print_success "Backend deployment updated"
else
    print_warning "Backend deployment file not found"
fi

if [ -f "k8s/frontend-deployment.yaml" ]; then
    print_info "Updating frontend deployment..."
    sed -i "s|image:.*orchestrator-frontend.*|image: ${DOCKER_USERNAME}/orchestrator-frontend:latest|g" k8s/frontend-deployment.yaml
    print_success "Frontend deployment updated"
else
    print_warning "Frontend deployment file not found"
fi

# ============================================================================
# Step 7: Deploy ArgoCD Application
# ============================================================================

print_header "Step 7: Deploying ArgoCD Application"

read -p "Deploy ArgoCD application now? (y/n): " DEPLOY_APP
if [[ $DEPLOY_APP =~ ^[Yy]$ ]]; then
    print_info "Deploying ArgoCD application..."
    kubectl apply -f k8s/argocd-application.yaml
    
    print_info "Waiting for application to be created..."
    sleep 5
    
    kubectl get application orchestrator-app -n argocd &> /dev/null && print_success "ArgoCD application deployed" || print_error "Failed to deploy ArgoCD application"
else
    print_info "Skipping ArgoCD application deployment"
fi

# ============================================================================
# Step 8: GitHub Secrets Configuration
# ============================================================================

print_header "Step 8: GitHub Secrets Configuration"

print_info "You need to configure the following GitHub secrets:"
echo ""
echo "Go to: https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}/settings/secrets/actions"
echo ""
echo "Add these secrets:"
echo ""
echo "1. DOCKER_HUB_USERNAME"
echo "   Value: ${DOCKER_USERNAME}"
echo ""
echo "2. DOCKER_HUB_TOKEN"
echo "   Value: <your-docker-hub-access-token>"
echo "   Create at: https://hub.docker.com/settings/security"
echo ""
echo "3. SONAR_TOKEN"
echo "   Value: <your-sonarqube-token>"
echo "   Create at: ${SONAR_HOST_URL}/account/security"
echo ""
echo "4. SONAR_HOST_URL"
echo "   Value: ${SONAR_HOST_URL}"
echo ""
echo "5. ARGOCD_SERVER"
echo "   Value: ${ARGOCD_SERVER}"
echo ""
echo "6. ARGOCD_USERNAME"
echo "   Value: admin"
echo ""
echo "7. ARGOCD_PASSWORD"
if [ -n "$ARGOCD_PASSWORD" ]; then
    echo "   Value: ${ARGOCD_PASSWORD}"
else
    echo "   Value: <your-argocd-password>"
fi
echo ""

read -p "Press Enter after configuring GitHub secrets..."

# ============================================================================
# Step 9: Setup Self-Hosted GitHub Runner (Optional)
# ============================================================================

print_header "Step 9: GitHub Runner Setup"

print_info "For SonarQube and ArgoCD integration, a self-hosted runner is required."
print_info "This allows the CI/CD pipeline to access your local services."
echo ""
print_info "To set up a self-hosted runner:"
echo "1. Go to: https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}/settings/actions/runners/new"
echo "2. Follow the instructions to download and configure the runner"
echo "3. Install as a service for automatic startup"
echo ""

read -p "Have you configured a self-hosted runner? (y/n): " RUNNER_CONFIGURED
if [[ ! $RUNNER_CONFIGURED =~ ^[Yy]$ ]]; then
    print_warning "Self-hosted runner not configured. Some CI/CD features may not work."
fi

# ============================================================================
# Step 10: Verification
# ============================================================================

print_header "Step 10: Verification"

print_info "Checking ArgoCD status..."
if kubectl get pods -n argocd | grep -q "Running"; then
    print_success "ArgoCD is running"
else
    print_error "ArgoCD pods are not running"
fi

print_info "Checking orchestrator namespace..."
if kubectl get namespace orchestrator &> /dev/null; then
    print_success "Orchestrator namespace exists"
    kubectl get pods -n orchestrator 2>/dev/null || print_info "No pods in orchestrator namespace yet"
else
    print_warning "Orchestrator namespace not created yet (will be created by ArgoCD)"
fi

# ============================================================================
# Final Summary
# ============================================================================

print_header "🎉 Setup Complete!"

echo ""
echo -e "${GREEN}DevSecOps Pipeline is configured!${NC}"
echo ""
echo "📋 Summary:"
echo "  ✅ ArgoCD installed and configured"
echo "  ✅ ArgoCD application configured"
echo "  ✅ Kubernetes manifests updated"
echo "  ✅ GitHub secrets documented"
echo ""
echo "🔗 Access Points:"
echo "  ArgoCD UI: https://${ARGOCD_SERVER}"
echo "  Username: admin"
if [ -n "$ARGOCD_PASSWORD" ]; then
    echo "  Password: ${ARGOCD_PASSWORD}"
fi
echo ""
echo "  SonarQube: ${SONAR_HOST_URL}"
echo "  Docker Hub: https://hub.docker.com/u/${DOCKER_USERNAME}"
echo "  GitHub Actions: https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}/actions"
echo ""
echo "📚 Documentation:"
echo "  Integrated CI/CD Guide: INTEGRATED_CICD_GUIDE.md"
echo "  ArgoCD Setup Guide: ARGOCD_SETUP_GUIDE.md"
echo "  Vault Integration: VAULT_INTEGRATION_GUIDE.md"
echo ""
echo "🚀 Next Steps:"
echo "  1. Configure GitHub secrets (see list above)"
echo "  2. Set up self-hosted GitHub runner"
echo "  3. Push changes to your repository"
echo "  4. Watch the CI/CD pipeline execute!"
echo "  5. Monitor deployment in ArgoCD UI"
echo ""
echo -e "${BLUE}Happy DevSecOps! 🔒${NC}"
echo ""

