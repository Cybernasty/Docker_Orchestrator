Write-Host "Updating frontend with corrected URLs..." -ForegroundColor Yellow

# Step 1: Build the frontend image
Write-Host "Building frontend Docker image..." -ForegroundColor Cyan
try {
    docker build -t localhost:6500/orchestrator-frontend:latest ./frontend_orchestrator
    Write-Host "✅ Frontend image built successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to build frontend image: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Push the image to local registry
Write-Host "Pushing image to local registry..." -ForegroundColor Cyan
try {
    docker push localhost:6500/orchestrator-frontend:latest
    Write-Host "✅ Image pushed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to push image: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Restart frontend pods to pick up new image
Write-Host "Restarting frontend pods..." -ForegroundColor Cyan
try {
    kubectl delete pods -n orchestrator -l app=frontend-orchestrator
    Write-Host "✅ Frontend pods restarted" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to restart pods: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: Wait for pods to be ready
Write-Host "Waiting for frontend pods to be ready..." -ForegroundColor Cyan
try {
    kubectl wait --for=condition=ready pod -l app=frontend-orchestrator -n orchestrator --timeout=120s
    Write-Host "✅ Frontend pods are ready" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Pods may still be starting up" -ForegroundColor Yellow
}

# Step 5: Check pod status
Write-Host "Checking pod status..." -ForegroundColor Cyan
kubectl get pods -n orchestrator -l app=frontend-orchestrator

Write-Host "`n🎉 Frontend update complete!" -ForegroundColor Green
Write-Host "Your application should now work correctly at: http://orchestrator.local" -ForegroundColor Cyan
Write-Host "You can now login with your admin user: montassar@example.com" -ForegroundColor Cyan 