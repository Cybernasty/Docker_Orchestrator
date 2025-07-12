# Orchestrator Local Kubernetes Setup Script for Windows
# This script sets up a local Kubernetes environment for development

param(
    [string]$ClusterType = "docker-desktop",
    [switch]$SkipPrerequisites,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
Orchestrator Local Kubernetes Setup Script

Usage: .\setup-local.ps1 [OPTIONS]

Options:
    -ClusterType <type>     Type of cluster to create (docker-desktop, minikube, kind)
    -SkipPrerequisites      Skip prerequisite installation
    -Help                   Show this help message

Examples:
    .\setup-local.ps1                           # Setup with Docker Desktop
    .\setup-local.ps1 -ClusterType minikube     # Setup with Minikube
    .\setup-local.ps1 -ClusterType kind         # Setup with Kind
    .\setup-local.ps1 -SkipPrerequisites        # Skip prerequisite installation

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

function Install-Chocolatey {
    Write-Status "Installing Chocolatey..."
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    Write-Success "Chocolatey installed"
}

function Install-Prerequisites {
    Write-Status "Installing prerequisites..."
    
    # Install Chocolatey if not present
    if (-not (Test-Command "choco")) {
        Install-Chocolatey
    }
    
    # Install kubectl
    if (-not (Test-Command "kubectl")) {
        Write-Status "Installing kubectl..."
        choco install kubernetes-cli -y
        Write-Success "kubectl installed"
    } else {
        Write-Status "kubectl already installed"
    }
    
    # Install Docker Desktop if not present
    if (-not (Test-Command "docker")) {
        Write-Status "Installing Docker Desktop..."
        choco install docker-desktop -y
        Write-Warning "Docker Desktop installed. Please restart your computer and enable Kubernetes in Docker Desktop settings."
        Write-Warning "After restart, run this script again with -SkipPrerequisites"
        exit 0
    } else {
        Write-Status "Docker already installed"
    }
    
    # Install Helm
    if (-not (Test-Command "helm")) {
        Write-Status "Installing Helm..."
        choco install kubernetes-helm -y
        Write-Success "Helm installed"
    } else {
        Write-Status "Helm already installed"
    }
}

function Setup-DockerDesktop {
    Write-Status "Setting up Docker Desktop with Kubernetes..."
    
    # Check if Docker Desktop is running
    try {
        docker version | Out-Null
    }
    catch {
        Write-Error "Docker Desktop is not running. Please start Docker Desktop and enable Kubernetes."
        exit 1
    }
    
    # Check if Kubernetes is enabled
    $kubeContext = kubectl config current-context
    if ($kubeContext -eq "docker-desktop") {
        Write-Success "Docker Desktop Kubernetes is already configured"
    } else {
        Write-Warning "Please enable Kubernetes in Docker Desktop settings and restart Docker Desktop"
        exit 1
    }
    
    # Enable ingress addon
    Write-Status "Enabling ingress addon..."
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
    
    # Wait for ingress controller
    Write-Status "Waiting for ingress controller to be ready..."
    kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=300s
    
    Write-Success "Docker Desktop setup complete"
}

function Setup-Minikube {
    Write-Status "Setting up Minikube..."
    
    # Install Minikube if not present
    if (-not (Test-Command "minikube")) {
        Write-Status "Installing Minikube..."
        choco install minikube -y
        Write-Success "Minikube installed"
    }
    
    # Start Minikube
    Write-Status "Starting Minikube..."
    minikube start --driver=docker --cpus=4 --memory=8192 --disk-size=20g
    
    # Enable addons
    Write-Status "Enabling Minikube addons..."
    minikube addons enable ingress
    minikube addons enable metrics-server
    
    Write-Success "Minikube setup complete"
}

function Setup-Kind {
    Write-Status "Setting up Kind..."
    
    # Install Kind if not present
    if (-not (Test-Command "kind")) {
        Write-Status "Installing Kind..."
        choco install kind -y
        Write-Success "Kind installed"
    }
    
    # Create cluster
    Write-Status "Creating Kind cluster..."
    kind create cluster --name orchestrator --config k8s/kind-config.yaml
    
    # Install ingress controller
    Write-Status "Installing ingress controller..."
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/kind/deploy.yaml
    
    # Wait for ingress controller
    Write-Status "Waiting for ingress controller to be ready..."
    kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=300s
    
    Write-Success "Kind setup complete"
}

function Test-Cluster {
    Write-Status "Testing cluster connectivity..."
    
    # Test kubectl
    try {
        kubectl cluster-info | Out-Null
        Write-Success "Cluster connectivity test passed"
    }
    catch {
        Write-Error "Cluster connectivity test failed"
        exit 1
    }
    
    # Show cluster info
    Write-Status "Cluster Information:"
    kubectl cluster-info
    kubectl get nodes
}

function Show-NextSteps {
    Write-Success "Local Kubernetes setup completed successfully!"
    Write-Host ""
    Write-Status "Next Steps:"
    Write-Host "1. Deploy the application:"
    Write-Host "   .\k8s\deploy.ps1"
    Write-Host ""
    Write-Host "2. Access the application:"
    Write-Host "   kubectl port-forward svc/frontend-orchestrator 8080:80 -n orchestrator"
    Write-Host "   Then open: http://localhost:8080"
    Write-Host ""
    Write-Host "3. View cluster status:"
    Write-Host "   kubectl get pods -n orchestrator"
    Write-Host ""
    Write-Host "4. View logs:"
    Write-Host "   kubectl logs -f deployment/backend-orchestrator -n orchestrator"
}

# Main execution
try {
    Write-Status "Starting Orchestrator local Kubernetes setup..."
    
    # Install prerequisites if not skipped
    if (-not $SkipPrerequisites) {
        Install-Prerequisites
    }
    
    # Setup cluster based on type
    switch ($ClusterType.ToLower()) {
        "docker-desktop" {
            Setup-DockerDesktop
        }
        "minikube" {
            Setup-Minikube
        }
        "kind" {
            Setup-Kind
        }
        default {
            Write-Error "Invalid cluster type: $ClusterType"
            Write-Host "Valid options: docker-desktop, minikube, kind"
            exit 1
        }
    }
    
    # Test cluster
    Test-Cluster
    
    # Show next steps
    Show-NextSteps
    
} catch {
    Write-Error "Setup failed: $($_.Exception.Message)"
    exit 1
} 