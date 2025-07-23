# Clean and Rebuild Script
# This script cleans Docker images, rebuilds them, and pushes to registry

param(
    [switch]$Help,
    [string]$Registry = "localhost:6500",
    [switch]$SkipPush,
    [switch]$Force
)

if ($Help) {
    Write-Host @"
Clean and Rebuild Script

Usage: .\clean-and-rebuild.ps1 [OPTIONS]

Options:
    -Registry <url>     Docker registry URL (default: localhost:5000)
    -SkipPush           Skip pushing to registry
    -Force              Skip confirmation prompts
    -Help               Show this help message

Examples:
    .\clean-and-rebuild.ps1                    # Clean, build, and push
    .\clean-and-rebuild.ps1 -SkipPush         # Clean and build only
    .\clean-and-rebuild.ps1 -Registry my-registry.com  # Use custom registry

"@
    exit 0
}

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"
$Cyan = "Cyan"

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

function Test-Docker {
    try {
        docker version | Out-Null
        Write-Success "Docker is available"
        return $true
    }
    catch {
        Write-Error "Docker is not available"
        exit 1
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

function Clean-Images {
    Write-Step "Cleaning Docker images..."
    
    # Remove old orchestrator images
    $images = @(
        "$Registry/orchestrator-backend:latest",
        "$Registry/orchestrator-frontend:latest",
        "orchestrator-backend:latest",
        "orchestrator-frontend:latest"
    )
    
    foreach ($image in $images) {
        Write-Status "Removing image: $image"
        docker rmi $image 2>$null
    }
    
    # Clean up dangling images
    Write-Status "Cleaning up dangling images..."
    docker image prune -f
    
    Write-Success "Docker images cleaned"
}

function Build-Images {
    Write-Step "Building Docker images..."
    
    $BackendImage = "$Registry/orchestrator-backend:latest"
    $FrontendImage = "$Registry/orchestrator-frontend:latest"
    
    # Build backend image
    Write-Status "Building backend image..."
    docker build -t $BackendImage ../backend_orchestrator
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build backend image"
        exit 1
    }
    Write-Success "Backend image built successfully"
    
    # Build frontend image
    Write-Status "Building frontend image..."
    docker build -t $FrontendImage ../frontend_orchestrator
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build frontend image"
        exit 1
    }
    Write-Success "Frontend image built successfully"
}

function Push-Images {
    if ($SkipPush) {
        Write-Warning "Skipping image push as requested"
        return
    }
    
    Write-Step "Pushing images to registry..."
    
    $BackendImage = "$Registry/orchestrator-backend:latest"
    $FrontendImage = "$Registry/orchestrator-frontend:latest"
    
    # Push backend image
    Write-Status "Pushing backend image..."
    docker push $BackendImage
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to push backend image"
        exit 1
    }
    Write-Success "Backend image pushed successfully"
    
    # Push frontend image
    Write-Status "Pushing frontend image..."
    docker push $FrontendImage
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to push frontend image"
        exit 1
    }
    Write-Success "Frontend image pushed successfully"
}

function Show-Images {
    Write-Step "Current images:"
    docker images | Select-String "orchestrator"
    
    Write-Host ""
    Write-Status "Registry Information:"
    Write-Host "  - Registry URL: http://$Registry"
    Write-Host "  - Backend Image: $Registry/orchestrator-backend:latest"
    Write-Host "  - Frontend Image: $Registry/orchestrator-frontend:latest"
}

# Main function
function Main {
    Write-Host "Clean and Rebuild Script" -ForegroundColor Cyan
    Write-Host "=========================" -ForegroundColor Cyan
    
    # Check prerequisites
    Test-Docker
    
    # Confirm operation
    if (-not (Confirm-Operation "This will clean existing images and rebuild them. Continue?")) {
        Write-Warning "Operation cancelled by user"
        exit 0
    }
    
    # Clean images
    Clean-Images
    
    # Build images
    Build-Images
    
    # Push images
    Push-Images
    
    # Show results
    Show-Images
    
    Write-Success "Clean and rebuild completed successfully!"
}

# Execute main function
try {
    Main
} catch {
    Write-Error "Clean and rebuild failed: $($_.Exception.Message)"
    exit 1
} 