# Local Build and Deploy Script
# This script builds images locally and pushes them to your local registry

Write-Host "Local Build and Deploy for Container Orchestrator" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# Configuration
$REGISTRY = "localhost:6500"
$FRONTEND_IMAGE = "orchestrator-frontend"
$BACKEND_IMAGE = "orchestrator-backend"
$NAMESPACE = "orchestrator"

# Check if Docker is available
try {
    $dockerVersion = docker --version
    Write-Host "Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "Docker not found. Please install Docker first." -ForegroundColor Red
    exit 1
}

# Check if kubectl is available
try {
    $kubectlVersion = kubectl version --client --short
    Write-Host "kubectl found: $kubectlVersion" -ForegroundColor Green
} catch {
    Write-Host "kubectl not found. Please install kubectl first." -ForegroundColor Red
    exit 1
}

# Check if local registry is accessible
Write-Host "`nChecking local registry..." -ForegroundColor Yellow
try {
    $registryResponse = Invoke-WebRequest -Uri "http://$REGISTRY/v2/_catalog" -TimeoutSec 5
    Write-Host "Local registry is accessible" -ForegroundColor Green
} catch {
    Write-Host "Local registry not accessible. Make sure it's running on $REGISTRY" -ForegroundColor Red
    Write-Host "You can start it with: docker run -d -p 6500:5000 --name registry registry:2" -ForegroundColor Cyan
    exit 1
}

# Build and push backend image
Write-Host "`nBuilding backend image..." -ForegroundColor Yellow
try {
    docker build -t "localhost:6500/$BACKEND_IMAGE:latest" ./backend_orchestrator
    Write-Host "Backend image built successfully" -ForegroundColor Green
    
    docker push "localhost:6500/$BACKEND_IMAGE:latest"
    Write-Host "Backend image pushed to localhost:6500" -ForegroundColor Green
} catch {
    Write-Host "Failed to build/push backend image: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Build and push frontend image
Write-Host "`nBuilding frontend image..." -ForegroundColor Yellow
try {
    docker build -t "localhost:6500/$FRONTEND_IMAGE:latest" ./frontend_orchestrator
    Write-Host "Frontend image built successfully" -ForegroundColor Green
    
    docker push "localhost:6500/$FRONTEND_IMAGE:latest"
    Write-Host "Frontend image pushed to localhost:6500" -ForegroundColor Green
} catch {
    Write-Host "Failed to build/push frontend image: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Deploy to Kubernetes
Write-Host "`nDeploying to Kubernetes..." -ForegroundColor Yellow

try {
    # Apply Kubernetes manifests
    kubectl apply -f k8s/namespace.yaml
    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/secrets.yaml
    
    # Update deployment images
    kubectl set image deployment/frontend-orchestrator frontend="localhost:6500/$FRONTEND_IMAGE:latest" -n $NAMESPACE
    kubectl set image statefulset/backend-orchestrator backend="localhost:6500/$BACKEND_IMAGE:latest" -n $NAMESPACE
    
    # Wait for rollout
    kubectl rollout status deployment/frontend-orchestrator -n $NAMESPACE
    kubectl rollout status statefulset/backend-orchestrator -n $NAMESPACE
    
    Write-Host "Deployment completed successfully" -ForegroundColor Green
} catch {
    Write-Host "Failed to deploy: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Health check
Write-Host "`nPerforming health check..." -ForegroundColor Yellow
try {
    # Wait for services to be ready
    kubectl wait --for=condition=ready pod -l app=frontend-orchestrator -n $NAMESPACE --timeout=300s
    kubectl wait --for=condition=ready pod -l app=backend-orchestrator -n $NAMESPACE --timeout=300s
    
    # Show pod status
    Write-Host "`nPod Status:" -ForegroundColor Cyan
    kubectl get pods -n $NAMESPACE
    
    Write-Host "`nService Status:" -ForegroundColor Cyan
    kubectl get services -n $NAMESPACE
    
    Write-Host "`nDeployment successful!" -ForegroundColor Green
    Write-Host "Your application should be accessible at: http://orchestrator.local" -ForegroundColor Cyan
    
} catch {
    Write-Host "Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Check pod status manually:" -ForegroundColor Yellow
    Write-Host "kubectl get pods -n $NAMESPACE" -ForegroundColor White
    Write-Host "kubectl describe pod <pod-name> -n $NAMESPACE" -ForegroundColor White
} 