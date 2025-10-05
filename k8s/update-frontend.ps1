#!/usr/bin/env pwsh

# Update Frontend for Kubernetes Deployment
# This script rebuilds the frontend image and updates the Kubernetes deployment

param(
    [string]$Registry = "cybermonta",
    [switch]$Force = $false
)

Write-Host "🔄 Updating Frontend for Kubernetes Deployment..." -ForegroundColor Cyan

# Step 1: Build new frontend image
Write-Host "📦 Building new frontend image..." -ForegroundColor Yellow
$frontendImage = "$Registry/orchestrator-frontend:latest"

try {
    Set-Location "frontend_orchestrator"
    docker build -t $frontendImage .
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to build frontend image"
    }
    Write-Host "✅ Frontend image built successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to build frontend image: $_" -ForegroundColor Red
    exit 1
} finally {
    Set-Location ".."
}

# Step 2: Push image to registry
Write-Host "📤 Pushing frontend image to registry..." -ForegroundColor Yellow
try {
    docker push $frontendImage
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to push frontend image"
    }
    Write-Host "✅ Frontend image pushed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to push frontend image: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Restart frontend deployment
Write-Host "🔄 Restarting frontend deployment..." -ForegroundColor Yellow
try {
    kubectl rollout restart deployment/frontend-orchestrator -n orchestrator
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to restart frontend deployment"
    }
    Write-Host "✅ Frontend deployment restarted successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to restart frontend deployment: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Wait for rollout to complete
Write-Host "⏳ Waiting for rollout to complete..." -ForegroundColor Yellow
try {
    kubectl rollout status deployment/frontend-orchestrator -n orchestrator --timeout=300s
    if ($LASTEXITCODE -ne 0) {
        throw "Rollout did not complete successfully"
    }
    Write-Host "✅ Frontend rollout completed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend rollout failed: $_" -ForegroundColor Red
    exit 1
}

# Step 5: Show access information
Write-Host "`n🎉 Frontend update completed successfully!" -ForegroundColor Green
Write-Host "📱 Access your application at:" -ForegroundColor Cyan
Write-Host "   Frontend: http://192.168.11.143:30080" -ForegroundColor White
Write-Host "   Backend API: http://192.168.11.143:30050" -ForegroundColor White
Write-Host "`n🔐 Login credentials:" -ForegroundColor Cyan
Write-Host "   Email: admin@example.com" -ForegroundColor White
Write-Host "   Password: myadminpassword" -ForegroundColor White






