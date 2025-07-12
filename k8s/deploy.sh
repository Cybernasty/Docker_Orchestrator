#!/bin/bash

# Orchestrator Kubernetes Deployment Script
# This script deploys the Orchestrator application to Kubernetes with high availability

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="orchestrator"
MONITORING_NAMESPACE="monitoring"
REGISTRY="your-registry.com"
BACKEND_IMAGE="${REGISTRY}/orchestrator-backend:latest"
FRONTEND_IMAGE="${REGISTRY}/orchestrator-frontend:latest"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if kubectl is available
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    print_success "kubectl found"
}

# Function to check if namespace exists
check_namespace() {
    if kubectl get namespace $1 &> /dev/null; then
        print_status "Namespace $1 already exists"
    else
        print_status "Creating namespace $1"
        kubectl apply -f k8s/namespace.yaml
    fi
}

# Function to build and push Docker images
build_images() {
    print_status "Building Docker images..."
    
    # Build backend image
    print_status "Building backend image..."
    docker build -t $BACKEND_IMAGE ./backend_orchestrator
    
    # Build frontend image
    print_status "Building frontend image..."
    docker build -t $FRONTEND_IMAGE ./frontend_orchestrator
    
    # Push images
    print_status "Pushing images to registry..."
    docker push $BACKEND_IMAGE
    docker push $FRONTEND_IMAGE
    
    print_success "Images built and pushed successfully"
}

# Function to update image references in manifests
update_images() {
    print_status "Updating image references in manifests..."
    
    # Update backend image
    sed -i "s|orchestrator-backend:latest|$BACKEND_IMAGE|g" k8s/backend-deployment.yaml
    
    # Update frontend image
    sed -i "s|orchestrator-frontend:latest|$FRONTEND_IMAGE|g" k8s/frontend-deployment.yaml
    
    print_success "Image references updated"
}

# Function to deploy secrets and configmaps
deploy_config() {
    print_status "Deploying secrets and configmaps..."
    kubectl apply -f k8s/secrets.yaml
    kubectl apply -f k8s/configmap.yaml
    print_success "Configuration deployed"
}

# Function to deploy MongoDB
deploy_mongodb() {
    print_status "Deploying MongoDB..."
    kubectl apply -f k8s/mongodb-statefulset.yaml
    
    # Wait for MongoDB to be ready
    print_status "Waiting for MongoDB to be ready..."
    kubectl wait --for=condition=ready pod -l app=mongodb -n $NAMESPACE --timeout=300s
    print_success "MongoDB deployed and ready"
}

# Function to deploy backend
deploy_backend() {
    print_status "Deploying backend..."
    kubectl apply -f k8s/backend-deployment.yaml
    
    # Wait for backend to be ready
    print_status "Waiting for backend to be ready..."
    kubectl wait --for=condition=ready pod -l app=backend-orchestrator -n $NAMESPACE --timeout=300s
    print_success "Backend deployed and ready"
}

# Function to deploy frontend
deploy_frontend() {
    print_status "Deploying frontend..."
    kubectl apply -f k8s/frontend-deployment.yaml
    
    # Wait for frontend to be ready
    print_status "Waiting for frontend to be ready..."
    kubectl wait --for=condition=ready pod -l app=frontend-orchestrator -n $NAMESPACE --timeout=300s
    print_success "Frontend deployed and ready"
}

# Function to deploy ingress
deploy_ingress() {
    print_status "Deploying ingress..."
    kubectl apply -f k8s/ingress.yaml
    print_success "Ingress deployed"
}

# Function to deploy monitoring
deploy_monitoring() {
    print_status "Deploying monitoring..."
    kubectl apply -f k8s/monitoring.yaml
    print_success "Monitoring deployed"
}

# Function to deploy autoscaling
deploy_autoscaling() {
    print_status "Deploying autoscaling..."
    kubectl apply -f k8s/hpa.yaml
    print_success "Autoscaling deployed"
}

# Function to deploy network policies
deploy_network_policies() {
    print_status "Deploying network policies..."
    kubectl apply -f k8s/network-policy.yaml
    print_success "Network policies deployed"
}

# Function to verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Check pods
    print_status "Checking pod status..."
    kubectl get pods -n $NAMESPACE
    
    # Check services
    print_status "Checking services..."
    kubectl get services -n $NAMESPACE
    
    # Check ingress
    print_status "Checking ingress..."
    kubectl get ingress -n $NAMESPACE
    
    # Check HPA
    print_status "Checking HPA..."
    kubectl get hpa -n $NAMESPACE
    
    print_success "Deployment verification complete"
}

# Function to show access information
show_access_info() {
    print_success "Deployment completed successfully!"
    echo
    print_status "Access Information:"
    echo "  - Application URL: https://orchestrator.example.com"
    echo "  - Health Check: https://orchestrator.example.com/health"
    echo "  - Metrics: https://orchestrator.example.com/metrics"
    echo
    print_status "Monitoring:"
    echo "  - Prometheus: http://prometheus.example.com"
    echo "  - Grafana: http://grafana.example.com"
    echo
    print_status "Useful Commands:"
    echo "  - View logs: kubectl logs -f deployment/backend-orchestrator -n $NAMESPACE"
    echo "  - Scale backend: kubectl scale statefulset backend-orchestrator --replicas=5 -n $NAMESPACE"
    echo "  - Port forward: kubectl port-forward svc/frontend-orchestrator 8080:80 -n $NAMESPACE"
}

# Main deployment function
main() {
    print_status "Starting Orchestrator Kubernetes deployment..."
    
    # Check prerequisites
    check_kubectl
    
    # Create namespaces
    check_namespace $NAMESPACE
    check_namespace $MONITORING_NAMESPACE
    
    # Build and push images (if needed)
    if [ "$1" = "--build" ]; then
        build_images
        update_images
    fi
    
    # Deploy components
    deploy_config
    deploy_mongodb
    deploy_backend
    deploy_frontend
    deploy_ingress
    deploy_monitoring
    deploy_autoscaling
    deploy_network_policies
    
    # Verify deployment
    verify_deployment
    
    # Show access information
    show_access_info
}

# Help function
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  --build    Build and push Docker images before deployment"
    echo "  --help     Show this help message"
    echo
    echo "Examples:"
    echo "  $0                    # Deploy using existing images"
    echo "  $0 --build           # Build and deploy"
}

# Parse command line arguments
case "$1" in
    --help)
        show_help
        exit 0
        ;;
    --build)
        main "$1"
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac 