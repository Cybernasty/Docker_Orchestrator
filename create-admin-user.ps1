Write-Host "Creating admin user via API..." -ForegroundColor Yellow

# Test if the API is accessible
Write-Host "Testing API accessibility..." -ForegroundColor Cyan
try {
    $healthResponse = Invoke-RestMethod -Uri "http://orchestrator.local/health" -Method GET -UseBasicParsing
    Write-Host "✅ API is accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ API not accessible: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Create admin user
Write-Host "Creating admin user..." -ForegroundColor Cyan
$userData = @{
    email = "admin@orchestrator.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://orchestrator.local/api/auth/register" -Method POST -Body $userData -ContentType "application/json" -UseBasicParsing
    Write-Host "✅ Admin user created successfully!" -ForegroundColor Green
    Write-Host "Email: admin@orchestrator.com" -ForegroundColor Cyan
    Write-Host "Password: admin123" -ForegroundColor Cyan
    Write-Host "Token: $($response.token)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Failed to create user: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to get more details about the error
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error details: $errorBody" -ForegroundColor Red
    }
} 