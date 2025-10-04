#!/usr/bin/env pwsh

Write-Host "🔄 Building and pushing fixed frontend image..." -ForegroundColor Cyan

# Build the image
Write-Host "📦 Building frontend image..." -ForegroundColor Yellow
docker build -t cybermonta/orchestrator-frontend:latest frontend_orchestrator/

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build frontend image" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Frontend image built successfully" -ForegroundColor Green

# Push the image
Write-Host "📤 Pushing frontend image to Docker Hub..." -ForegroundColor Yellow
docker push cybermonta/orchestrator-frontend:latest

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push frontend image" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Frontend image pushed successfully" -ForegroundColor Green
Write-Host "🎉 Ready to restart Kubernetes deployment!" -ForegroundColor Cyan





