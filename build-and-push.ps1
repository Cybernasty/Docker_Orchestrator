# Build and Push Images to Local Registry
# This script builds and pushes the latest frontend and backend images

Write-Host "🚀 Building and pushing images to localhost:6500..." -ForegroundColor Green

# Build Frontend Image
Write-Host "📦 Building frontend image..." -ForegroundColor Yellow
docker build -t localhost:6500/orchestrator-frontend:latest frontend_orchestrator/
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend build completed" -ForegroundColor Green

# Build Backend Image
Write-Host "📦 Building backend image..." -ForegroundColor Yellow
docker build -t localhost:6500/orchestrator-backend:latest backend_orchestrator/
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend build completed" -ForegroundColor Green

# Push Frontend Image
Write-Host "📤 Pushing frontend image to registry..." -ForegroundColor Yellow
docker push localhost:6500/orchestrator-frontend:latest
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend push failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend pushed successfully" -ForegroundColor Green

# Push Backend Image
Write-Host "📤 Pushing backend image to registry..." -ForegroundColor Yellow
docker push localhost:6500/orchestrator-backend:latest
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend push failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend pushed successfully" -ForegroundColor Green

Write-Host "🎉 All images built and pushed successfully!" -ForegroundColor Green
Write-Host "📋 Images available at:" -ForegroundColor Cyan
Write-Host "   - localhost:6500/orchestrator-frontend:latest" -ForegroundColor White
Write-Host "   - localhost:6500/orchestrator-backend:latest" -ForegroundColor White 