Write-Host "Adding hosts file entry for orchestrator.local..." -ForegroundColor Yellow

$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$hostEntry = "127.0.0.1 orchestrator.local"

# Check if entry already exists
$currentHosts = Get-Content $hostsPath
if ($currentHosts -contains $hostEntry) {
    Write-Host "Host entry already exists!" -ForegroundColor Green
    exit 0
}

try {
    # Add the entry
    Add-Content -Path $hostsPath -Value $hostEntry -Force
    Write-Host "Host entry added successfully!" -ForegroundColor Green
    Write-Host "You can now access your application at: http://orchestrator.local" -ForegroundColor Cyan
} catch {
    Write-Host "Failed to add host entry. Please run PowerShell as Administrator." -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nManual steps:" -ForegroundColor Yellow
    Write-Host "1. Open Notepad as Administrator" -ForegroundColor White
    Write-Host "2. Open C:\Windows\System32\drivers\etc\hosts" -ForegroundColor White
    Write-Host "3. Add: 127.0.0.1 orchestrator.local" -ForegroundColor White
    Write-Host "4. Save and close" -ForegroundColor White
} 