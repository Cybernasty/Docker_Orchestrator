# Complete Kubernetes Redeployment Script
# This script deletes all resources, builds images, pushes to local registry, and redeploys

param(
    [switch]$Help,
    [string]$Registry = "localhost:6500",
    [switch]$SkipBuild,
    [switch]$SkipRegistry,
    [switch]$Force
)

if ($Help) {
    Write-Host @"
Complete Kubernetes Redeployment Script

Usage: .\redeploy-complete.ps1 [OPTIONS]

Options:
    -Registry <url>     Docker registry URL (default: localhost:5000)
    -SkipBuild          Skip building Docker images
    -SkipRegistry       Skip pushing to registry (use local images)
    -Force              Skip confirmation prompts
    -Help               Show this help message

Examples:
    .\redeploy-complete.ps1                    # Full redeploy with confirmation
    .\redeploy-complete.ps1 -Force            # Full redeploy without confirmation
    .\redeploy-complete.ps1 -SkipBuild        # Redeploy without rebuilding images
    .\redeploy-complete.ps1 -Registry my-registry.com  # Use custom registry

"@
    exit 0
}

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"
$Cyan = "Cyan"
$Magenta = "Magenta"

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

function Write-Step {
    param([string]$Message)
    Write-Host "[STEP] $Message" -ForegroundColor $Cyan
}

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "=" * 60 -ForegroundColor $Magenta
    Write-Host "  $Message" -ForegroundColor $Magenta
    Write-Host "=" * 60 -ForegroundColor $Magenta
    Write-Host ""
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

function Test-Registry {
    Write-Status "Testing registry connection..."
    try {
        $response = Invoke-WebRequest -Uri "http://$Registry/v2/" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Success "Registry $Registry is accessible"
            return $true
        }
    }
    catch {
        Write-Warning "Registry $Registry is not accessible. Starting local registry..."
        Start-LocalRegistry
        return $true
    }
}

function Start-LocalRegistry {
    Write-Status "Starting local Docker registry..."
    
    # Stop existing registry if running
    docker stop registry 2>$null
    docker rm registry 2>$null
    
    # Start new registry
    docker run -d --name registry -p 6500:5000 --restart=always registry:2
    
    # Wait for registry to be ready
    Start-Sleep -Seconds 5
    
    Write-Success "Local registry started on $Registry"
}

function Confirm-Operation {
    param([string]$Message)
    
    if ($Force) {
        return $true
    }
    
    Write-Warning $Message
    $response = Read-Host "Do you want to continue? (y/N)"
    return $response -eq "y" -or $response -eq "Y"
}

function Delete-AllResources {
    Write-Header "DELETING ALL KUBERNETES RESOURCES"
    
    Write-Step "Deleting all resources in orchestrator namespace..."
    
    # Delete all resources in the orchestrator namespace
    $resources = @(
        "deployment",
        "statefulset", 
        "service",
        "ingress",
        "configmap",
        "secret",
        "hpa",
        "networkpolicy",
        "pod"
    )
    
    foreach ($resource in $resources) {
        Write-Status "Deleting $resource resources..."
        kubectl delete $resource --all -n orchestrator --ignore-not-found=true 2>$null
    }
    
    # Delete namespace
    Write-Status "Deleting orchestrator namespace..."
    kubectl delete namespace orchestrator --ignore-not-found=true 2>$null
    
    # Wait for namespace deletion
    Write-Status "Waiting for namespace deletion to complete..."
    kubectl wait --for=delete namespace/orchestrator --timeout=60s 2>$null
    
    Write-Success "All resources deleted successfully"
}

function Clean-DockerImages {
    Write-Header "CLEANING DOCKER IMAGES"
    
    Write-Step "Removing old orchestrator images..."
    
    # Remove old images
    docker rmi "$Registry/orchestrator-backend:latest" 2>$null
    docker rmi "$Registry/orchestrator-frontend:latest" 2>$null
    docker rmi "orchestrator-backend:latest" 2>$null
    docker rmi "orchestrator-frontend:latest" 2>$null
    
    # Clean up dangling images
    Write-Status "Cleaning up dangling images..."
    docker image prune -f
    
    Write-Success "Docker images cleaned"
}

function Build-Images {
    Write-Header "BUILDING DOCKER IMAGES"
    
    if ($SkipBuild) {
        Write-Warning "Skipping image build as requested"
        return
    }
    
    $BackendImage = "$Registry/orchestrator-backend:latest"
    $FrontendImage = "$Registry/orchestrator-frontend:latest"
    
    # Build backend image
    Write-Step "Building backend image..."
    Write-Status "Building from: ../backend_orchestrator"
    docker build -t $BackendImage ../backend_orchestrator
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build backend image"
        exit 1
    }
    Write-Success "Backend image built successfully"
    
    # Build frontend image
    Write-Step "Building frontend image..."
    Write-Status "Building from: ../frontend_orchestrator"
    docker build -t $FrontendImage ../frontend_orchestrator
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build frontend image"
        exit 1
    }
    Write-Success "Frontend image built successfully"
}

function Push-Images {
    Write-Header "PUSHING IMAGES TO REGISTRY"
    
    if ($SkipRegistry) {
        Write-Warning "Skipping image push as requested"
        return
    }
    
    $BackendImage = "$Registry/orchestrator-backend:latest"
    $FrontendImage = "$Registry/orchestrator-frontend:latest"
    
    # Push backend image
    Write-Step "Pushing backend image..."
    docker push $BackendImage
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to push backend image"
        exit 1
    }
    Write-Success "Backend image pushed successfully"
    
    # Push frontend image
    Write-Step "Pushing frontend image..."
    docker push $FrontendImage
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to push frontend image"
        exit 1
    }
    Write-Success "Frontend image pushed successfully"
}

function Update-ImageReferences {
    Write-Header "UPDATING IMAGE REFERENCES"
    
    Write-Step "Updating image references in deployment manifests..."
    
    $BackendImage = "$Registry/orchestrator-backend:latest"
    $FrontendImage = "$Registry/orchestrator-frontend:latest"
    
    # Update backend image
    Write-Status "Updating backend deployment..."
    $backendContent = Get-Content backend-deployment.yaml -Raw
    $backendContent = $backendContent -replace 'image: .*orchestrator-backend:.*', "image: $BackendImage"
    Set-Content backend-deployment.yaml -Value $backendContent
    
    # Update frontend image
    Write-Status "Updating frontend deployment..."
    $frontendContent = Get-Content frontend-deployment.yaml -Raw
    $frontendContent = $frontendContent -replace 'image: .*orchestrator-frontend:.*', "image: $FrontendImage"
    Set-Content frontend-deployment.yaml -Value $frontendContent
    
    Write-Success "Image references updated"
}

function Deploy-Namespaces {
    Write-Step "Creating namespaces..."
    kubectl apply -f namespace.yaml
    Write-Success "Namespaces created"
}

function Deploy-Config {
    Write-Step "Deploying secrets and configmaps..."
    kubectl apply -f secrets.yaml
    kubectl apply -f configmap.yaml
    Write-Success "Configuration deployed"
}

function Deploy-MongoDB {
    Write-Step "Deploying MongoDB..."
    kubectl apply -f mongodb-statefulset.yaml
    
    # Wait for MongoDB to be ready
    Write-Status "Waiting for MongoDB to be ready..."
    kubectl wait --for=condition=ready pod -l app=mongodb -n orchestrator --timeout=300s
    Write-Success "MongoDB deployed and ready"
}

function Deploy-Backend {
    Write-Step "Deploying backend..."
    kubectl apply -f backend-deployment.yaml
    
    # Wait for backend to be ready
    Write-Status "Waiting for backend to be ready..."
    kubectl wait --for=condition=ready pod -l app=backend-orchestrator -n orchestrator --timeout=300s
    Write-Success "Backend deployed and ready"
}

function Deploy-Frontend {
    Write-Step "Deploying frontend..."
    kubectl apply -f frontend-deployment.yaml
    
    # Wait for frontend to be ready
    Write-Status "Waiting for frontend to be ready..."
    kubectl wait --for=condition=ready pod -l app=frontend-orchestrator -n orchestrator --timeout=300s
    Write-Success "Frontend deployed and ready"
}

function Deploy-Services {
    Write-Step "Deploying services..."
    kubectl apply -f loadbalancer-service.yaml
    Write-Success "Services deployed"
}

function Deploy-Ingress {
    Write-Step "Deploying ingress..."
    kubectl apply -f ingress.yaml
    Write-Success "Ingress deployed"
}

function Deploy-Monitoring {
    Write-Step "Deploying monitoring..."
    kubectl apply -f monitoring.yaml
    Write-Success "Monitoring deployed"
}

function Deploy-Autoscaling {
    Write-Step "Deploying autoscaling..."
    kubectl apply -f hpa.yaml
    Write-Success "Autoscaling deployed"
}

function Deploy-NetworkPolicies {
    Write-Step "Deploying network policies..."
    kubectl apply -f network-policy.yaml
    Write-Success "Network policies deployed"
}

function Verify-Deployment {
    Write-Header "VERIFYING DEPLOYMENT"
    
    # Check pods
    Write-Step "Checking pod status..."
    kubectl get pods -n orchestrator
    
    # Check services
    Write-Step "Checking services..."
    kubectl get services -n orchestrator
    
    # Check ingress
    Write-Step "Checking ingress..."
    kubectl get ingress -n orchestrator
    
    # Check HPA
    Write-Step "Checking HPA..."
    kubectl get hpa -n orchestrator
    
    # Check all resources
    Write-Step "Checking all resources..."
    kubectl get all -n orchestrator
    
    Write-Success "Deployment verification complete"
}

function Show-AccessInfo {
    Write-Header "DEPLOYMENT COMPLETE"
    Write-Success "Application redeployed successfully!"
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
    Write-Host "  - Scale backend: kubectl scale deployment backend-orchestrator --replicas=5 -n orchestrator"
    Write-Host "  - Check status: kubectl get pods -n orchestrator"
    Write-Host "  - Check events: kubectl get events -n orchestrator --sort-by='.lastTimestamp'"
    Write-Host ""
    Write-Status "Registry Information:"
    Write-Host "  - Registry URL: http://$Registry"
    Write-Host "  - Backend Image: $Registry/orchestrator-backend:latest"
    Write-Host "  - Frontend Image: $Registry/orchestrator-frontend:latest"
}

# Main redeployment function
function Main {
    Write-Header "ORCHESTRATOR COMPLETE REDEPLOYMENT"
    
    # Check prerequisites
    Test-Kubectl
    Test-Docker
    
    # Confirm operation
    if (-not (Confirm-Operation "This will DELETE ALL resources in the orchestrator namespace and redeploy everything. This action cannot be undone.")) {
        Write-Warning "Operation cancelled by user"
        exit 0
    }
    
    # Test registry
    Test-Registry
    
    # Delete all resources
    Delete-AllResources
    
    # Clean Docker images
    Clean-DockerImages
    
    # Build images
    Build-Images
    
    # Push images
    Push-Images
    
    # Update image references
    Update-ImageReferences
    
    # Deploy everything
    Write-Header "DEPLOYING APPLICATION"
    Deploy-Namespaces
    Deploy-Config
    Deploy-MongoDB
    Deploy-Backend
    Deploy-Frontend
    Deploy-Services
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
    Write-Error "Redeployment failed: $($_.Exception.Message)"
    Write-Error "Stack trace: $($_.ScriptStackTrace)"
    exit 1
} 