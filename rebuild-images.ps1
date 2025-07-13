# Rebuild Images Script for Orchestrator
# This script rebuilds the Docker images after fixing build issues

param(
    [string]$RegistryHost = "localhost",
    [string]$RegistryPort = "6500",
    [switch]$Help = $false
)

# Show help if requested
if ($Help) {
    Write-Host @"
Rebuild Images Script for Orchestrator

Usage: .\rebuild-images.ps1 [options]

Options:
    -RegistryHost <host>    Registry host (default: localhost)
    -RegistryPort <port>    Registry port (default: 6500)
    -Help                   Show this help message

Examples:
    .\rebuild-images.ps1
    .\rebuild-images.ps1 -RegistryHost "my-registry.com" -RegistryPort "5000"
    .\rebuild-images.ps1 -Help
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

# Function to clean up old images
function Remove-OldImages {
    param([string]$RegistryHost, [string]$RegistryPort)
    
    Write-Host "🧹 Cleaning up old images..." -ForegroundColor Green
    
    $registryUrl = "$RegistryHost`:$RegistryPort"
    
    # Remove old backend image
    try {
        docker rmi "$registryUrl/orchestrator-backend:latest" 2>$null
        Write-Host "✅ Removed old backend image" -ForegroundColor Green
    } catch {
        Write-Host "ℹ️  No old backend image to remove" -ForegroundColor Gray
    }
    
    # Remove old frontend image
    try {
        docker rmi "$registryUrl/orchestrator-frontend:latest" 2>$null
        Write-Host "✅ Removed old frontend image" -ForegroundColor Green
    } catch {
        Write-Host "ℹ️  No old frontend image to remove" -ForegroundColor Gray
    }
}

# Function to build images
function Build-Images {
    param([string]$RegistryHost, [string]$RegistryPort)
    
    Write-Host "🔨 Building images..." -ForegroundColor Green
    
    $registryUrl = "$RegistryHost`:$RegistryPort"
    
    # Build backend
    Write-Host "📦 Building backend image..." -ForegroundColor Cyan
    docker build -t "$registryUrl/orchestrator-backend:latest" ./backend_orchestrator
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backend image built successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend image build failed" -ForegroundColor Red
        return $false
    }
    
    # Build frontend
    Write-Host "📦 Building frontend image..." -ForegroundColor Cyan
    docker build -t "$registryUrl/orchestrator-frontend:latest" ./frontend_orchestrator
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Frontend image built successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend image build failed" -ForegroundColor Red
        return $false
    }
    
    return $true
}

# Function to push images
function Push-Images {
    param([string]$RegistryHost, [string]$RegistryPort)
    
    Write-Host "📤 Pushing images..." -ForegroundColor Green
    
    $registryUrl = "$RegistryHost`:$RegistryPort"
    
    # Push backend
    Write-Host "📤 Pushing backend image..." -ForegroundColor Cyan
    docker push "$registryUrl/orchestrator-backend:latest"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backend image pushed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend image push failed" -ForegroundColor Red
        return $false
    }
    
    # Push frontend
    Write-Host "📤 Pushing frontend image..." -ForegroundColor Cyan
    docker push "$registryUrl/orchestrator-frontend:latest"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Frontend image pushed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend image push failed" -ForegroundColor Red
        return $false
    }
    
    return $true
}

# Main execution
Write-Host "🔨 Rebuild Images for Orchestrator" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Check if Docker is running
if (!(Test-DockerRunning)) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker is running" -ForegroundColor Green

# Clean up old images
Remove-OldImages -RegistryHost $RegistryHost -RegistryPort $RegistryPort

# Build images
$buildSuccess = Build-Images -RegistryHost $RegistryHost -RegistryPort $RegistryPort
if (!$buildSuccess) {
    Write-Host "❌ Image build failed. Exiting." -ForegroundColor Red
    exit 1
}

# Push images
$pushSuccess = Push-Images -RegistryHost $RegistryHost -RegistryPort $RegistryPort
if (!$pushSuccess) {
    Write-Host "❌ Image push failed. Exiting." -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ All images rebuilt and pushed successfully!" -ForegroundColor Green
Write-Host "   Registry: $RegistryHost`:$RegistryPort" -ForegroundColor Yellow
Write-Host "   Backend: $RegistryHost`:$RegistryPort/orchestrator-backend:latest" -ForegroundColor Yellow
Write-Host "   Frontend: $RegistryHost`:$RegistryPort/orchestrator-frontend:latest" -ForegroundColor Yellow 