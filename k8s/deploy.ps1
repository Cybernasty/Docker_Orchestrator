# Orchestrator Kubernetes Deployment Script for Windows
# This script deploys the Orchestrator application to Kubernetes

param(
    [switch]$Build,
    [switch]$Help,
    [string]$Registry = "localhost:5000"
)

if ($Help) {
    Write-Host @"
Orchestrator Kubernetes Deployment Script

Usage: .\deploy.ps1 [OPTIONS]

Options:
    -Build              Build and push Docker images before deployment
    -Registry <url>     Docker registry URL (default: localhost:5000)
    -Help               Show this help message

Examples:
    .\deploy.ps1                    # Deploy using existing images
    .\deploy.ps1 -Build            # Build and deploy
    .\deploy.ps1 -Registry my-registry.com  # Use custom registry

"@
    exit 0
}

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Test-Kubectl {
    if (-not (Test-Command "kubectl")) {
        Write-Error "kubectl is not installed or not in PATH"
        exit 1
    }
    Write-Success "kubectl found"
}

function Test-Docker {
    if (-not (Test-Command "docker")) {
        Write-Error "Docker is not installed or not in PATH"
        exit 1
    }
    Write-Success "Docker found"
}

function Build-Images {
    Write-Status "Building Docker images..."
    
    $BackendImage = "$Registry/orchestrator-backend:latest"
    $FrontendImage = "$Registry/orchestrator-frontend:latest"
    
    # Build backend image
    Write-Status "Building backend image..."
    docker build -t $BackendImage ./backend_orchestrator
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build backend image"
        exit 1
    }
    
    # Build frontend image
    Write-Status "Building frontend image..."
    docker build -t $FrontendImage ./frontend_orchestrator
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build frontend image"
        exit 1
    }
    
    # Push images
    Write-Status "Pushing images to registry..."
    docker push $BackendImage
    docker push $FrontendImage
    
    Write-Success "Images built and pushed successfully"
}

function Update-ImageReferences {
    Write-Status "Updating image references in manifests..."
    
    $BackendImage = "$Registry/orchestrator-backend:latest"
    $FrontendImage = "$Registry/orchestrator-frontend:latest"
    
    # Update backend image
    (Get-Content k8s/backend-deployment.yaml) -replace 'orchestrator-backend:latest', $BackendImage | Set-Content k8s/backend-deployment.yaml
    
    # Update frontend image
    (Get-Content k8s/frontend-deployment.yaml) -replace 'orchestrator-frontend:latest', $FrontendImage | Set-Content k8s/frontend-deployment.yaml
    
    Write-Success "Image references updated"
}

function Deploy-Namespaces {
    Write-Status "Creating namespaces..."
    kubectl apply -f k8s/namespace.yaml
    Write-Success "Namespaces created"
}

function Deploy-Config {
    Write-Status "Deploying secrets and configmaps..."
    kubectl apply -f k8s/secrets.yaml
    kubectl apply -f k8s/configmap.yaml
    Write-Success "Configuration deployed"
}

function Deploy-MongoDB {
    Write-Status "Deploying MongoDB..."
    kubectl apply -f k8s/mongodb-statefulset.yaml
    
    # Wait for MongoDB to be ready
    Write-Status "Waiting for MongoDB to be ready..."
    kubectl wait --for=condition=ready pod -l app=mongodb -n orchestrator --timeout=300s
    Write-Success "MongoDB deployed and ready"
}

function Deploy-Backend {
    Write-Status "Deploying backend..."
    kubectl apply -f k8s/backend-deployment.yaml
    
    # Wait for backend to be ready
    Write-Status "Waiting for backend to be ready..."
    kubectl wait --for=condition=ready pod -l app=backend-orchestrator -n orchestrator --timeout=300s
    Write-Success "Backend deployed and ready"
}

function Deploy-Frontend {
    Write-Status "Deploying frontend..."
    kubectl apply -f k8s/frontend-deployment.yaml
    
    # Wait for frontend to be ready
    Write-Status "Waiting for frontend to be ready..."
    kubectl wait --for=condition=ready pod -l app=frontend-orchestrator -n orchestrator --timeout=300s
    Write-Success "Frontend deployed and ready"
}

function Deploy-Ingress {
    Write-Status "Deploying ingress..."
    kubectl apply -f k8s/ingress.yaml
    Write-Success "Ingress deployed"
}

function Deploy-Monitoring {
    Write-Status "Deploying monitoring..."
    kubectl apply -f k8s/monitoring.yaml
    Write-Success "Monitoring deployed"
}

function Deploy-Autoscaling {
    Write-Status "Deploying autoscaling..."
    kubectl apply -f k8s/hpa.yaml
    Write-Success "Autoscaling deployed"
}

function Deploy-NetworkPolicies {
    Write-Status "Deploying network policies..."
    kubectl apply -f k8s/network-policy.yaml
    Write-Success "Network policies deployed"
}

function Verify-Deployment {
    Write-Status "Verifying deployment..."
    
    # Check pods
    Write-Status "Checking pod status..."
    kubectl get pods -n orchestrator
    
    # Check services
    Write-Status "Checking services..."
    kubectl get services -n orchestrator
    
    # Check ingress
    Write-Status "Checking ingress..."
    kubectl get ingress -n orchestrator
    
    # Check HPA
    Write-Status "Checking HPA..."
    kubectl get hpa -n orchestrator
    
    Write-Success "Deployment verification complete"
}

function Show-AccessInfo {
    Write-Success "Deployment completed successfully!"
    Write-Host ""
    Write-Status "Access Information:"
    Write-Host "  - Application URL: https://orchestrator.example.com"
    Write-Host "  - Health Check: https://orchestrator.example.com/health"
    Write-Host "  - Metrics: https://orchestrator.example.com/metrics"
    Write-Host ""
    Write-Status "Local Access:"
    Write-Host "  - Port forward: kubectl port-forward svc/frontend-orchestrator 8080:80 -n orchestrator"
    Write-Host "  - Then open: http://localhost:8080"
    Write-Host ""
    Write-Status "Useful Commands:"
    Write-Host "  - View logs: kubectl logs -f deployment/backend-orchestrator -n orchestrator"
    Write-Host "  - Scale backend: kubectl scale statefulset backend-orchestrator --replicas=5 -n orchestrator"
    Write-Host "  - Check status: kubectl get pods -n orchestrator"
}

# Main deployment function
function Main {
    Write-Status "Starting Orchestrator Kubernetes deployment..."
    
    # Check prerequisites
    Test-Kubectl
    Test-Docker
    
    # Build and push images if requested
    if ($Build) {
        Build-Images
        Update-ImageReferences
    }
    
    # Deploy components
    Deploy-Namespaces
    Deploy-Config
    Deploy-MongoDB
    Deploy-Backend
    Deploy-Frontend
    Deploy-Ingress
    Deploy-Monitoring
    Deploy-Autoscaling
    Deploy-NetworkPolicies
    
    # Verify deployment
    Verify-Deployment
    
    # Show access information
    Show-AccessInfo
}

# Execute main function
try {
    Main
} catch {
    Write-Error "Deployment failed: $($_.Exception.Message)"
    exit 1
} 