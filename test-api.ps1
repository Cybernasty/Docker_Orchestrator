Write-Host "Testing API connection and authentication..." -ForegroundColor Yellow

# Test API health
Write-Host "`n1. Testing API health..." -ForegroundColor Cyan
try {
    $healthResponse = Invoke-RestMethod -Uri "http://orchestrator.local/health" -Method GET -UseBasicParsing
    Write-Host "✅ API Health: $($healthResponse.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ API Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test backend API directly
Write-Host "`n2. Testing backend API..." -ForegroundColor Cyan
try {
    $backendResponse = Invoke-RestMethod -Uri "http://orchestrator.local/api/containers" -Method GET -UseBasicParsing
    Write-Host "✅ Backend API accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend API failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test authentication endpoint
Write-Host "`n3. Testing authentication endpoint..." -ForegroundColor Cyan
try {
    $authTest = @{
        email = "test@example.com"
        password = "testpassword"
    } | ConvertTo-Json

    $authResponse = Invoke-RestMethod -Uri "http://orchestrator.local/api/auth/login" -Method POST -Body $authTest -ContentType "application/json" -UseBasicParsing
    Write-Host "✅ Authentication endpoint working" -ForegroundColor Green
} catch {
    Write-Host "❌ Authentication endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📝 To create an admin user, you can:" -ForegroundColor Yellow
Write-Host "1. Register a new account at http://orchestrator.local" -ForegroundColor White
Write-Host "2. Or use the API directly:" -ForegroundColor White
Write-Host "   curl -X POST http://orchestrator.local/api/auth/register" -ForegroundColor Cyan
Write-Host "   -H 'Content-Type: application/json'" -ForegroundColor Cyan
Write-Host "   -d '{\"email\":\"admin@example.com\",\"password\":\"admin123\"}'" -ForegroundColor Cyan 