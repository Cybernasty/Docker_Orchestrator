# Enable Docker Desktop API for external connections
Write-Host "🔧 Enabling Docker Desktop API..." -ForegroundColor Yellow

# Check if Docker Desktop is running
$dockerRunning = docker info 2>$null
if (-not $dockerRunning) {
    Write-Host "❌ Docker Desktop is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker Desktop is running" -ForegroundColor Green

# Create Docker Desktop settings directory if it doesn't exist
$dockerSettingsPath = "$env:USERPROFILE\AppData\Roaming\Docker\settings.json"
$dockerSettingsDir = Split-Path $dockerSettingsPath -Parent

if (-not (Test-Path $dockerSettingsDir)) {
    New-Item -ItemType Directory -Path $dockerSettingsDir -Force | Out-Null
}

# Read existing settings or create new ones
if (Test-Path $dockerSettingsPath) {
    $settings = Get-Content $dockerSettingsPath | ConvertFrom-Json
} else {
    $settings = @{}
}

# Enable experimental features and expose daemon
$settings | Add-Member -MemberType NoteProperty -Name "experimental" -Value $true -Force
$settings | Add-Member -MemberType NoteProperty -Name "hosts" -Value @("tcp://0.0.0.0:2375", "npipe:////./pipe/docker_engine") -Force

# Save settings
$settings | ConvertTo-Json -Depth 10 | Set-Content $dockerSettingsPath

Write-Host "✅ Docker Desktop settings updated" -ForegroundColor Green
Write-Host "🔄 Please restart Docker Desktop for changes to take effect" -ForegroundColor Yellow
Write-Host "📝 After restart, Docker API will be available at: tcp://localhost:2375" -ForegroundColor Cyan

# Test the API connection
Write-Host "🧪 Testing Docker API connection..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:2375/version" -Method GET -TimeoutSec 5
    Write-Host "✅ Docker API is accessible!" -ForegroundColor Green
    Write-Host "🐳 Docker version: $($response.Version)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Docker API not accessible yet. Please restart Docker Desktop." -ForegroundColor Red
    Write-Host "💡 You can also manually enable it in Docker Desktop Settings > General > 'Use the WSL 2 based engine' and 'Expose daemon on tcp://localhost:2375 without TLS'" -ForegroundColor Yellow
} 