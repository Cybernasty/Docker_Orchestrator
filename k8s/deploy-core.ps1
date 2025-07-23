# Core Application Deployment Script
# This script deploys only the frontend and backend without MongoDB

param(
    [switch]$Help,
    [string]$Registry = "localhost:6500",
    [switch]$SkipBuild,
    [switch]$Force
)

if ($Help) {
    Write-Host @"
Core Application Deployment Script

Usage: .\deploy-core.ps1 [OPTIONS]

Options:
    -Registry <url>     Docker registry URL (default: localhost:6500)
    -SkipBuild          Skip building Docker images
    -Force              Skip confirmation prompts
    -Help               Show this help message

Examples:
    .\deploy-core.ps1                    # Deploy with confirmation
    .\deploy-core.ps1 -Force            # Deploy without confirmation
    .\deploy-core.ps1 -SkipBuild        # Deploy without rebuilding images

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
        Write-Warning "Registry $Registry is not accessible"
        return $false
    }
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
    
    # Check all resources
    Write-Step "Checking all resources..."
    kubectl get all -n orchestrator
    
    Write-Success "Deployment verification complete"
}

function Show-AccessInfo {
    Write-Header "DEPLOYMENT COMPLETE"
    Write-Success "Core application deployed successfully!"
    Write-Host ""
    Write-Status "Access Information:"
    Write-Host "  - Application URL: https://orchestrator.example.com"
    Write-Host "  - Health Check: https://orchestrator.example.com/health"
    Write-Host ""
    Write-Status "Local Access:"
    Write-Host "  - Port forward: kubectl port-forward svc/frontend-orchestrator 8080:80 -n orchestrator"
    Write-Host "  - Then open: http://localhost:8080"
    Write-Host ""
    Write-Status "Useful Commands:"
    Write-Host "  - View logs: kubectl logs -f deployment/backend-orchestrator -n orchestrator"
    Write-Host "  - View frontend logs: kubectl logs -f deployment/frontend-orchestrator -n orchestrator"
    Write-Host "  - Check status: kubectl get pods -n orchestrator"
    Write-Host "  - Check events: kubectl get events -n orchestrator --sort-by='.lastTimestamp'"
    Write-Host ""
    Write-Status "Registry Information:"
    Write-Host "  - Registry URL: http://$Registry"
    Write-Host "  - Backend Image: $Registry/orchestrator-backend:latest"
    Write-Host "  - Frontend Image: $Registry/orchestrator-frontend:latest"
}

# Main deployment function
function Main {
    Write-Header "ORCHESTRATOR CORE DEPLOYMENT"
    
    # Check prerequisites
    Test-Kubectl
    Test-Docker
    
    # Confirm operation
    if (-not (Confirm-Operation "This will deploy the core application (frontend + backend) without MongoDB. Continue?")) {
        Write-Warning "Operation cancelled by user"
        exit 0
    }
    
    # Test registry
    if (-not (Test-Registry)) {
        Write-Error "Registry is not accessible. Please ensure registry is running on $Registry"
        exit 1
    }
    
    # Build images
    Build-Images
    
    # Push images
    Push-Images
    
    # Update image references
    Update-ImageReferences
    
    # Deploy everything
    Write-Header "DEPLOYING CORE APPLICATION"
    Deploy-Namespaces
    Deploy-Config
    Deploy-Backend
    Deploy-Frontend
    Deploy-Services
    Deploy-Ingress
    
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
    Write-Error "Stack trace: $($_.ScriptStackTrace)"
    exit 1
} 