# Quick Redeploy Script
# This script quickly redeploys the application to pick up new images

param(
    [switch]$Help,
    [switch]$Force
)

if ($Help) {
    Write-Host @"
Quick Redeploy Script

Usage: .\quick-redeploy.ps1 [OPTIONS]

Options:
    -Force              Skip confirmation prompts
    -Help               Show this help message

Examples:
    .\quick-redeploy.ps1                    # Quick redeploy with confirmation
    .\quick-redeploy.ps1 -Force            # Quick redeploy without confirmation

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

function Test-Kubectl {
    try {
        kubectl version --client | Out-Null
        Write-Success "kubectl is available"
        return $true
    }
    catch {
        Write-Error "kubectl is not available"
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

function Restart-Deployments {
    Write-Step "Restarting deployments..."
    
    # Restart backend deployment
    Write-Status "Restarting backend deployment..."
    kubectl rollout restart deployment/backend-orchestrator -n orchestrator
    
    # Restart frontend deployment
    Write-Status "Restarting frontend deployment..."
    kubectl rollout restart deployment/frontend-orchestrator -n orchestrator
    
    Write-Success "Deployments restarted"
}

function Wait-For-Rollout {
    Write-Step "Waiting for rollouts to complete..."
    
    # Wait for backend rollout
    Write-Status "Waiting for backend rollout..."
    kubectl rollout status deployment/backend-orchestrator -n orchestrator --timeout=300s
    
    # Wait for frontend rollout
    Write-Status "Waiting for frontend rollout..."
    kubectl rollout status deployment/frontend-orchestrator -n orchestrator --timeout=300s
    
    Write-Success "Rollouts completed"
}

function Verify-Deployment {
    Write-Step "Verifying deployment..."
    
    # Check pod status
    Write-Status "Checking pod status..."
    kubectl get pods -n orchestrator
    
    # Check deployment status
    Write-Status "Checking deployment status..."
    kubectl get deployments -n orchestrator
    
    Write-Success "Deployment verification complete"
}

function Show-Status {
    Write-Step "Current application status:"
    
    Write-Host ""
    Write-Status "Pods:"
    kubectl get pods -n orchestrator -o wide
    
    Write-Host ""
    Write-Status "Services:"
    kubectl get services -n orchestrator
    
    Write-Host ""
    Write-Status "Access Information:"
    Write-Host "  - Port forward: kubectl port-forward svc/frontend-orchestrator 8080:80 -n orchestrator"
    Write-Host "  - Then open: http://localhost:8080"
    Write-Host ""
    Write-Status "Useful Commands:"
    Write-Host "  - View logs: kubectl logs -f deployment/backend-orchestrator -n orchestrator"
    Write-Host "  - Check events: kubectl get events -n orchestrator --sort-by='.lastTimestamp'"
}

# Main function
function Main {
    Write-Host "Quick Redeploy Script" -ForegroundColor Cyan
    Write-Host "=====================" -ForegroundColor Cyan
    
    # Check prerequisites
    Test-Kubectl
    
    # Confirm operation
    if (-not (Confirm-Operation "This will restart the deployments to pick up new images. Continue?")) {
        Write-Warning "Operation cancelled by user"
        exit 0
    }
    
    # Restart deployments
    Restart-Deployments
    
    # Wait for rollouts
    Wait-For-Rollout
    
    # Verify deployment
    Verify-Deployment
    
    # Show status
    Show-Status
    
    Write-Success "Quick redeploy completed successfully!"
}

# Execute main function
try {
    Main
} catch {
    Write-Error "Quick redeploy failed: $($_.Exception.Message)"
    exit 1
} 