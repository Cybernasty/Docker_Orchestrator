# Docker Registry Setup Script for Orchestrator
# This script sets up a local Docker registry and builds the application images

param(
    [string]$RegistryPort = "6500",
    [string]$RegistryHost = "localhost",
    [switch]$SetupRegistry = $true,
    [switch]$BuildImages = $true,
    [switch]$PushImages = $true,
    [switch]$Help = $false
)

# Show help if requested
if ($Help) {
    Write-Host @"
Docker Registry Setup Script for Orchestrator

Usage: .\setup-registry.ps1 [options]

Options:
    -RegistryPort <port>    Registry port (default: 6500)
    -RegistryHost <host>    Registry host (default: localhost)
    -SetupRegistry          Setup local Docker registry
    -BuildImages            Build application images
    -PushImages             Push images to registry
    -Help                   Show this help message

Examples:
    .\setup-registry.ps1
    .\setup-registry.ps1 -RegistryPort 5000 -BuildImages
    .\setup-registry.ps1 -Help
"@
    exit 0
}

# Function to check if Docker is running
function Test-DockerRunning {
    try {
        docker version | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Function to setup local Docker registry
function Start-LocalRegistry {
    param([string]$Port)
    
    Write-Host "🐳 Setting up local Docker registry on port $Port..." -ForegroundColor Green
    
    # Stop existing registry if running
    try {
        docker stop local-registry 2>$null
        docker rm local-registry 2>$null
    } catch {
        # Ignore errors if container doesn't exist
    }
    
    # Start new registry
    try {
        docker run -d --name local-registry -p "${Port}:5000" registry:2
        Write-Host "✅ Local registry started on port $Port" -ForegroundColor Green
        
        # Wait for registry to be ready
        Start-Sleep -Seconds 5
        
        # Test registry
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$Port/v2/" -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ Registry is responding correctly" -ForegroundColor Green
            }
        } catch {
            Write-Host "⚠️  Registry may not be fully ready yet" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "❌ Failed to start registry: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    
    return $true
}

# Function to build application images
function Build-ApplicationImages {
    param([string]$RegistryHost, [string]$RegistryPort)
    
    Write-Host "🔨 Building application images..." -ForegroundColor Green
    
    $registryUrl = "$RegistryHost`:$RegistryPort"
    
    # Build backend image
    Write-Host "📦 Building backend image..." -ForegroundColor Cyan
    try {
        docker build -t "$registryUrl/orchestrator-backend:latest" ./backend_orchestrator
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Backend image built successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Backend image build failed" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Backend build error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    
    # Build frontend image
    Write-Host "📦 Building frontend image..." -ForegroundColor Cyan
    try {
        docker build -t "$registryUrl/orchestrator-frontend:latest" ./frontend_orchestrator
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Frontend image built successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Frontend image build failed" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Frontend build error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    
    return $true
}

# Function to push images to registry
function Push-ImagesToRegistry {
    param([string]$RegistryHost, [string]$RegistryPort)
    
    Write-Host "📤 Pushing images to registry..." -ForegroundColor Green
    
    $registryUrl = "$RegistryHost`:$RegistryPort"
    
    # Push backend image
    Write-Host "📤 Pushing backend image..." -ForegroundColor Cyan
    try {
        docker push "$registryUrl/orchestrator-backend:latest"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Backend image pushed successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Backend image push failed" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Backend push error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    
    # Push frontend image
    Write-Host "📤 Pushing frontend image..." -ForegroundColor Cyan
    try {
        docker push "$registryUrl/orchestrator-frontend:latest"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Frontend image pushed successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Frontend image push failed" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Frontend push error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    
    return $true
}

# Function to update Kubernetes manifests
function Update-KubernetesManifests {
    param([string]$RegistryHost, [string]$RegistryPort)
    
    Write-Host "📝 Updating Kubernetes manifests..." -ForegroundColor Green
    
    $registryUrl = "$RegistryHost`:$RegistryPort"
    
    # Update backend deployment
    $backendFile = "k8s/backend-deployment.yaml"
    if (Test-Path $backendFile) {
        $content = Get-Content $backendFile -Raw
        $updatedContent = $content -replace "image: orchestrator-backend:latest", "image: $registryUrl/orchestrator-backend:latest"
        $updatedContent | Out-File $backendFile -Encoding UTF8
        Write-Host "✅ Updated backend deployment manifest" -ForegroundColor Green
    }
    
    # Update frontend deployment
    $frontendFile = "k8s/frontend-deployment.yaml"
    if (Test-Path $frontendFile) {
        $content = Get-Content $frontendFile -Raw
        $updatedContent = $content -replace "image: orchestrator-frontend:latest", "image: $registryUrl/orchestrator-frontend:latest"
        $updatedContent | Out-File $frontendFile -Encoding UTF8
        Write-Host "✅ Updated frontend deployment manifest" -ForegroundColor Green
    }
}

# Function to show registry information
function Show-RegistryInfo {
    param([string]$RegistryHost, [string]$RegistryPort)
    
    Write-Host "`n📋 Registry Information:" -ForegroundColor Cyan
    Write-Host "=======================" -ForegroundColor Cyan
    Write-Host "Registry URL: $RegistryHost`:$RegistryPort" -ForegroundColor Yellow
    Write-Host "Backend Image: $RegistryHost`:$RegistryPort/orchestrator-backend:latest" -ForegroundColor Yellow
    Write-Host "Frontend Image: $RegistryHost`:$RegistryPort/orchestrator-frontend:latest" -ForegroundColor Yellow
    
    Write-Host "`n🔗 Registry API:" -ForegroundColor Cyan
    Write-Host "   Catalog: http://$RegistryHost`:$RegistryPort/v2/_catalog" -ForegroundColor Gray
    Write-Host "   Health: http://$RegistryHost`:$RegistryPort/v2/" -ForegroundColor Gray
    
    Write-Host "`n🐳 Docker Commands:" -ForegroundColor Cyan
    Write-Host "   List images: docker images $RegistryHost`:$RegistryPort/*" -ForegroundColor Gray
    Write-Host "   Pull backend: docker pull $RegistryHost`:$RegistryPort/orchestrator-backend:latest" -ForegroundColor Gray
    Write-Host "   Pull frontend: docker pull $RegistryHost`:$RegistryPort/orchestrator-frontend:latest" -ForegroundColor Gray
}

# Main execution
Write-Host "🐳 Docker Registry Setup for Orchestrator" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Check if Docker is running
if (!(Test-DockerRunning)) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker is running" -ForegroundColor Green

# Setup registry if requested
if ($SetupRegistry) {
    $registryStarted = Start-LocalRegistry -Port $RegistryPort
    if (!$registryStarted) {
        Write-Host "❌ Failed to setup registry. Exiting." -ForegroundColor Red
        exit 1
    }
}

# Build images if requested
if ($BuildImages) {
    $imagesBuilt = Build-ApplicationImages -RegistryHost $RegistryHost -RegistryPort $RegistryPort
    if (!$imagesBuilt) {
        Write-Host "❌ Failed to build images. Exiting." -ForegroundColor Red
        exit 1
    }
}

# Push images if requested
if ($PushImages) {
    $imagesPushed = Push-ImagesToRegistry -RegistryHost $RegistryHost -RegistryPort $RegistryPort
    if (!$imagesPushed) {
        Write-Host "❌ Failed to push images. Exiting." -ForegroundColor Red
        exit 1
    }
}

# Update Kubernetes manifests
Update-KubernetesManifests -RegistryHost $RegistryHost -RegistryPort $RegistryPort

# Show registry information
Show-RegistryInfo -RegistryHost $RegistryHost -RegistryPort $RegistryPort

Write-Host "`n✅ Setup completed successfully!" -ForegroundColor Green
Write-Host "   You can now deploy to Kubernetes using: .\k8s\deploy.ps1" -ForegroundColor Yellow 