#!/bin/bash

# Single command deployment for Orchestrator application pointing to Ubuntu Docker daemon
# Usage: ./deploy-single-command.sh [--skip-build] [--force]

set -e

# Configuration
NAMESPACE="orchestrator"
DOCKER_REGISTRY="cybermonta"
BACKEND_IMAGE="$DOCKER_REGISTRY/orchestrator-backend:latest"
FRONTEND_IMAGE="$DOCKER_REGISTRY/orchestrator-frontend:latest"
UBUNTU_HOST="192.168.11.149"

# Parse arguments
SKIP_BUILD=false
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        *)
            echo "Unknown option $1"
            exit 1
            ;;
    esac
done

echo "🚀 Starting Orchestrator Deployment to Ubuntu Docker Daemon"
echo "📍 Ubuntu Host: $UBUNTU_HOST"
echo "📦 Docker Registry: $DOCKER_REGISTRY"

# Function to execute commands with error handling
execute_command() {
    local cmd="$1"
    local description="$2"
    
    echo "🔄 $description"
    echo "   Command: $cmd"
    
    if eval "$cmd"; then
        echo "✅ $description - Success"
    else
        echo "❌ $description - Failed"
        exit 1
    fi
}

# Step 1: Create namespace
execute_command "kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -" "Creating namespace"

# Step 2: Build and push images (if not skipped)
if [ "$SKIP_BUILD" = false ]; then
    echo "🐳 Building and pushing Docker images..."
    
    # Build backend
    execute_command "docker build -t $BACKEND_IMAGE ../backend_orchestrator" "Building backend image"
    
    # Build frontend  
    execute_command "docker build -t $FRONTEND_IMAGE ../frontend_orchestrator" "Building frontend image"
    
    # Push images
    echo "📤 Pushing images to Docker Hub..."
    execute_command "docker push $BACKEND_IMAGE" "Pushing backend image"
    execute_command "docker push $FRONTEND_IMAGE" "Pushing frontend image"
else
    echo "⏭️  Skipping image build and push"
fi

# Step 3: Apply ConfigMap with Ubuntu Docker daemon configuration
execute_command "kubectl apply -f configmap.yaml -n $NAMESPACE" "Applying ConfigMap with Ubuntu Docker daemon config"

# Step 4: Create secrets (if they don't exist)
echo "🔐 Creating secrets..."
execute_command "kubectl create secret generic orchestrator-secrets \
  --from-literal=JWT_SECRET='your-super-secret-jwt-key-change-this-in-production' \
  --from-literal=SSL_PASSPHRASE='' \
  --dry-run=client -o yaml | kubectl apply -f - -n $NAMESPACE" "Creating application secrets"

# Step 5: Deploy MongoDB
echo "🍃 Deploying MongoDB..."
execute_command "kubectl apply -f mongodb-deployment.yaml -n $NAMESPACE" "Deploying MongoDB"
execute_command "kubectl apply -f mongodb-service.yaml -n $NAMESPACE" "Deploying MongoDB service"

# Step 6: Deploy Backend (StatefulSet)
echo "⚙️  Deploying Backend StatefulSet..."
execute_command "kubectl apply -f backend-deployment.yaml -n $NAMESPACE" "Deploying backend StatefulSet"

# Step 7: Deploy Frontend
echo "🎨 Deploying Frontend..."
execute_command "kubectl apply -f frontend-deployment.yaml -n $NAMESPACE" "Deploying frontend"

# Step 8: Deploy Services
echo "🌐 Deploying Services..."
execute_command "kubectl apply -f services.yaml -n $NAMESPACE" "Deploying NodePort services"

# Step 9: Wait for deployments
echo "⏳ Waiting for deployments to be ready..."

# Wait for MongoDB
execute_command "kubectl wait --for=condition=ready pod -l app=mongodb -n $NAMESPACE --timeout=300s" "Waiting for MongoDB to be ready"

# Wait for Backend
execute_command "kubectl wait --for=condition=ready pod -l app=backend-orchestrator -n $NAMESPACE --timeout=300s" "Waiting for backend to be ready"

# Wait for Frontend
execute_command "kubectl wait --for=condition=ready pod -l app=frontend-orchestrator -n $NAMESPACE --timeout=300s" "Waiting for frontend to be ready"

# Step 10: Display deployment status
echo "📊 Deployment Status:"
execute_command "kubectl get pods -n $NAMESPACE" "Getting pod status"
execute_command "kubectl get services -n $NAMESPACE" "Getting service status"

# Step 11: Display access information
echo ""
echo "🎉 Deployment Complete!"
echo "============================================================"
echo "📍 Application Access URLs:"
echo "   Frontend: http://<kubernetes-node-ip>:30080"
echo "   Backend:  http://<kubernetes-node-ip>:30050"
echo ""
echo "🔧 Docker Configuration:"
echo "   Docker Host: tcp://$UBUNTU_HOST:2375"
echo "   Registry: $DOCKER_REGISTRY"
echo ""
echo "📋 Useful Commands:"
echo "   Check pods:     kubectl get pods -n $NAMESPACE"
echo "   View logs:      kubectl logs -f deployment/frontend-orchestrator -n $NAMESPACE"
echo "   View backend:   kubectl logs -f statefulset/backend-orchestrator -n $NAMESPACE"
echo "   Port forward:   kubectl port-forward svc/frontend-orchestrator-nodeport 8080:80 -n $NAMESPACE"

# Step 12: Test connectivity to Ubuntu Docker daemon
echo ""
echo "🔍 Testing Ubuntu Docker daemon connectivity..."
if kubectl run docker-test --image=curlimages/curl --rm -i --restart=Never -- curl -s "http://$UBUNTU_HOST:2375/version" >/dev/null 2>&1; then
    echo "✅ Ubuntu Docker daemon is accessible!"
else
    echo "⚠️  Warning: Could not verify Ubuntu Docker daemon connectivity"
    echo "   Make sure Docker daemon is running on $UBUNTU_HOST:2375"
fi

echo ""
echo "🚀 Orchestrator application deployed successfully!"
echo "   The application will now manage containers on Ubuntu host: $UBUNTU_HOST"




