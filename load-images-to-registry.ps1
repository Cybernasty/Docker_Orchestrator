# Load Images to Local Registry Script
# This script downloads images from GitHub Actions artifacts and loads them into your local registry

param(
    [string]$RunId = "",
    [string]$Repository = "Cybernasty/Docker_Orchestrator"
)

Write-Host "Loading Images to Local Registry" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Check if run ID is provided
if (-not $RunId) {
    Write-Host "Please provide a GitHub Actions run ID" -ForegroundColor Yellow
    Write-Host "Usage: .\load-images-to-registry.ps1 -RunId <run-id>" -ForegroundColor Cyan
    Write-Host "You can find the run ID in your GitHub Actions tab" -ForegroundColor Cyan
    exit 1
}

# Check if gh CLI is available
try {
    $ghVersion = gh --version
    Write-Host "GitHub CLI found: $ghVersion" -ForegroundColor Green
} catch {
    Write-Host "GitHub CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "https://cli.github.com/" -ForegroundColor Cyan
    exit 1
}

# Check if Docker is available
try {
    $dockerVersion = docker --version
    Write-Host "Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "Docker not found. Please install Docker first." -ForegroundColor Red
    exit 1
}

Write-Host "`nDownloading artifacts from run $RunId..." -ForegroundColor Yellow

# Create temporary directory
$tempDir = "temp-artifacts"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Download artifacts
try {
    gh run download $RunId --repo $Repository --dir $tempDir
    Write-Host "Artifacts downloaded successfully" -ForegroundColor Green
} catch {
    Write-Host "Failed to download artifacts: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Check if docker-images artifact exists
$dockerImagesDir = Join-Path $tempDir "docker-images"
if (-not (Test-Path $dockerImagesDir)) {
    Write-Host "docker-images artifact not found. Available artifacts:" -ForegroundColor Red
    Get-ChildItem $tempDir | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Cyan }
    exit 1
}

Write-Host "`nLoading images to local registry..." -ForegroundColor Yellow

# Load backend image
$backendImagePath = Join-Path $dockerImagesDir "backend-image.tar"
if (Test-Path $backendImagePath) {
    Write-Host "Loading backend image..." -ForegroundColor Cyan
    docker load -i $backendImagePath
    Write-Host "Backend image loaded successfully" -ForegroundColor Green
} else {
    Write-Host "Backend image not found" -ForegroundColor Red
}

# Load frontend image
$frontendImagePath = Join-Path $dockerImagesDir "frontend-image.tar"
if (Test-Path $frontendImagePath) {
    Write-Host "Loading frontend image..." -ForegroundColor Cyan
    docker load -i $frontendImagePath
    Write-Host "Frontend image loaded successfully" -ForegroundColor Green
} else {
    Write-Host "Frontend image not found" -ForegroundColor Red
}

# Push images to local registry
Write-Host "`nPushing images to local registry..." -ForegroundColor Yellow

try {
    # Push backend image
    docker push localhost:6500/orchestrator-backend:latest
    Write-Host "Backend image pushed to localhost:6500" -ForegroundColor Green
    
    # Push frontend image
    docker push localhost:6500/orchestrator-frontend:latest
    Write-Host "Frontend image pushed to localhost:6500" -ForegroundColor Green
} catch {
    Write-Host "Failed to push images: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure your local registry is running on localhost:6500" -ForegroundColor Yellow
}

# Clean up
Write-Host "`nCleaning up temporary files..." -ForegroundColor Yellow
Remove-Item $tempDir -Recurse -Force

Write-Host "`nImages loaded successfully!" -ForegroundColor Green
Write-Host "You can now deploy to Kubernetes using:" -ForegroundColor Cyan
Write-Host "kubectl set image deployment/frontend-orchestrator frontend=localhost:6500/orchestrator-frontend:latest -n orchestrator" -ForegroundColor White
Write-Host "kubectl set image statefulset/backend-orchestrator backend=localhost:6500/orchestrator-backend:latest -n orchestrator" -ForegroundColor White 