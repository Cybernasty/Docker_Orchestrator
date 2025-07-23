# Build Frontend Only Script
# This script builds and pushes only the frontend image for testing

Write-Host "Building Frontend Image Only" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green

# Check if Docker is available
try {
    $dockerVersion = docker --version
    Write-Host "Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "Docker not found. Please install Docker first." -ForegroundColor Red
    exit 1
}

# Check if local registry is accessible
Write-Host "`nChecking local registry..." -ForegroundColor Yellow
try {
    $registryResponse = Invoke-WebRequest -Uri "http://localhost:6500/v2/_catalog" -TimeoutSec 5
    Write-Host "Local registry is accessible" -ForegroundColor Green
} catch {
    Write-Host "Local registry not accessible. Starting registry..." -ForegroundColor Yellow
    docker run -d -p 6500:5000 --name registry registry:2
    Start-Sleep -Seconds 3
}

# Build frontend image
Write-Host "`nBuilding frontend image..." -ForegroundColor Yellow
try {
    docker build -t localhost:6500/orchestrator-frontend:latest ./frontend_orchestrator
    Write-Host "Frontend image built successfully" -ForegroundColor Green
} catch {
    Write-Host "Failed to build frontend image: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Push frontend image
Write-Host "`nPushing frontend image..." -ForegroundColor Yellow
try {
    docker push localhost:6500/orchestrator-frontend:latest
    Write-Host "Frontend image pushed successfully" -ForegroundColor Green
} catch {
    Write-Host "Failed to push frontend image: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Update Kubernetes deployment
Write-Host "`nUpdating Kubernetes deployment..." -ForegroundColor Yellow
try {
    kubectl set image deployment/frontend-orchestrator frontend=localhost:6500/orchestrator-frontend:latest -n orchestrator
    Write-Host "Deployment updated successfully" -ForegroundColor Green
} catch {
    Write-Host "Failed to update deployment: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`nFrontend deployment completed!" -ForegroundColor Green
Write-Host "You can now test the login page at: http://orchestrator.local" -ForegroundColor Cyan
Write-Host "Check the browser console for debug logs to verify input values are being captured." -ForegroundColor Yellow 