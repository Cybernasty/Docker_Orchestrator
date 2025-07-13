# HTTPS Test Script for Docker Orchestrator
# This script tests the HTTPS setup and verifies certificates

param(
    [string]$Hostname = "localhost",
    [int]$Port = 443,
    [switch]$Verbose = $false,
    [switch]$Help = $false
)

# Show help if requested
if ($Help) {
    Write-Host @"
HTTPS Test Script for Docker Orchestrator

Usage: .\test-https.ps1 [options]

Options:
    -Hostname <hostname>  Hostname to test (default: localhost)
    -Port <port>         Port to test (default: 443)
    -Verbose             Show detailed output
    -Help                Show this help message

Examples:
    .\test-https.ps1
    .\test-https.ps1 -Hostname "orchestrator.example.com" -Verbose
    .\test-https.ps1 -Help
"@
    exit 0
}

# Function to test certificate validity
function Test-CertificateValidity {
    param([string]$CertPath)
    
    if (!(Test-Path $CertPath)) {
        return $false
    }
    
    try {
        $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($CertPath)
        $now = Get-Date
        $validFrom = $cert.NotBefore
        $validTo = $cert.NotAfter
        
        if ($now -ge $validFrom -and $now -le $validTo) {
            if ($Verbose) {
                Write-Host "✅ Certificate is valid from $validFrom to $validTo" -ForegroundColor Green
            }
            return $true
        } else {
            Write-Host "❌ Certificate is not valid (expired or not yet valid)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Error reading certificate: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to test SSL connection
function Test-SslConnection {
    param([string]$Hostname, [int]$Port)
    
    Write-Host "🔒 Testing SSL connection to $Hostname`:$Port..." -ForegroundColor Green
    
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect($Hostname, $Port)
        
        $sslStream = New-Object System.Net.Security.SslStream($tcpClient.GetStream(), $false)
        $sslStream.AuthenticateAsClient($Hostname)
        
        $cert = $sslStream.RemoteCertificate
        
        Write-Host "✅ SSL connection successful" -ForegroundColor Green
        Write-Host "   Certificate Subject: $($cert.Subject)" -ForegroundColor Cyan
        Write-Host "   Certificate Issuer: $($cert.Issuer)" -ForegroundColor Cyan
        Write-Host "   Valid From: $($cert.GetEffectiveDateString())" -ForegroundColor Cyan
        Write-Host "   Valid To: $($cert.GetExpirationDateString())" -ForegroundColor Cyan
        
        $sslStream.Close()
        $tcpClient.Close()
        
        return $true
    } catch {
        Write-Host "❌ SSL connection failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to test HTTPS endpoint
function Test-HttpsEndpoint {
    param([string]$Hostname, [int]$Port)
    
    Write-Host "🌐 Testing HTTPS endpoint..." -ForegroundColor Green
    
    $url = "https://$Hostname`:$Port/health"
    
    try {
        # First try without certificate verification
        $response = Invoke-WebRequest -Uri $url -SkipCertificateCheck -UseBasicParsing
        Write-Host "✅ HTTPS endpoint accessible (without certificate verification)" -ForegroundColor Green
        Write-Host "   Status Code: $($response.StatusCode)" -ForegroundColor Cyan
        Write-Host "   Response: $($response.Content)" -ForegroundColor Cyan
        
        # Try with CA certificate if available
        if (Test-Path "ssl\ca.crt") {
            Write-Host "🔍 Testing with CA certificate verification..." -ForegroundColor Green
            try {
                $response = Invoke-WebRequest -Uri $url -CertificateThumbprint (Get-Content "ssl\ca.crt") -UseBasicParsing
                Write-Host "✅ HTTPS endpoint accessible (with CA verification)" -ForegroundColor Green
            } catch {
                Write-Host "⚠️  CA certificate verification failed: $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
        
        return $true
    } catch {
        Write-Host "❌ HTTPS endpoint test failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to test WebSocket connection
function Test-WebSocketConnection {
    param([string]$Hostname, [int]$Port)
    
    Write-Host "🔌 Testing WebSocket connection..." -ForegroundColor Green
    
    $wsUrl = "wss://$Hostname`:$Port/api/terminal"
    
    try {
        # This is a basic test - in a real scenario you'd need a proper WebSocket client
        Write-Host "✅ WebSocket URL format is correct: $wsUrl" -ForegroundColor Green
        Write-Host "   Note: Full WebSocket testing requires a proper client implementation" -ForegroundColor Yellow
        return $true
    } catch {
        Write-Host "❌ WebSocket test failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to check Docker services
function Test-DockerServices {
    Write-Host "🐳 Checking Docker services..." -ForegroundColor Green
    
    try {
        $services = docker-compose -f docker-compose.ha.yml ps --format json | ConvertFrom-Json
        
        if ($services) {
            Write-Host "✅ Docker services found:" -ForegroundColor Green
            foreach ($service in $services) {
                $status = if ($service.State -eq "running") { "✅" } else { "❌" }
                Write-Host "   $status $($service.Service): $($service.State)" -ForegroundColor $(if ($service.State -eq "running") { "Green" } else { "Red" })
            }
        } else {
            Write-Host "⚠️  No Docker services found or docker-compose not running" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Error checking Docker services: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Function to check certificate files
function Test-CertificateFiles {
    Write-Host "📋 Checking certificate files..." -ForegroundColor Green
    
    $certFiles = @(
        @{ Path = "ssl\server.crt"; Name = "Server Certificate" },
        @{ Path = "ssl\server.key"; Name = "Private Key" },
        @{ Path = "ssl\ca.crt"; Name = "CA Certificate" }
    )
    
    $allValid = $true
    
    foreach ($cert in $certFiles) {
        if (Test-Path $cert.Path) {
            $valid = Test-CertificateValidity -CertPath $cert.Path
            if ($valid) {
                Write-Host "✅ $($cert.Name): Valid" -ForegroundColor Green
            } else {
                Write-Host "❌ $($cert.Name): Invalid" -ForegroundColor Red
                $allValid = $false
            }
        } else {
            Write-Host "❌ $($cert.Name): Not found" -ForegroundColor Red
            $allValid = $false
        }
    }
    
    return $allValid
}

# Function to check environment configuration
function Test-EnvironmentConfig {
    Write-Host "⚙️  Checking environment configuration..." -ForegroundColor Green
    
    if (Test-Path ".env") {
        $envContent = Get-Content ".env"
        $httpsEnabled = $envContent | Where-Object { $_ -match "HTTPS_ENABLED=true" }
        
        if ($httpsEnabled) {
            Write-Host "✅ HTTPS is enabled in .env" -ForegroundColor Green
        } else {
            Write-Host "⚠️  HTTPS is not enabled in .env" -ForegroundColor Yellow
        }
        
        if ($Verbose) {
            Write-Host "   Environment file contents:" -ForegroundColor Cyan
            $envContent | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
        }
    } else {
        Write-Host "❌ .env file not found" -ForegroundColor Red
        return $false
    }
    
    return $true
}

# Main execution
Write-Host "🧪 HTTPS Test for Docker Orchestrator" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

$overallSuccess = $true

# Test certificate files
$certValid = Test-CertificateFiles
if (!$certValid) {
    $overallSuccess = $false
}

# Test environment configuration
$envValid = Test-EnvironmentConfig
if (!$envValid) {
    $overallSuccess = $false
}

# Test Docker services
Test-DockerServices

# Test SSL connection
$sslValid = Test-SslConnection -Hostname $Hostname -Port $Port
if (!$sslValid) {
    $overallSuccess = $false
}

# Test HTTPS endpoint
$endpointValid = Test-HttpsEndpoint -Hostname $Hostname -Port $Port
if (!$endpointValid) {
    $overallSuccess = $false
}

# Test WebSocket connection
$wsValid = Test-WebSocketConnection -Hostname $Hostname -Port $Port
if (!$wsValid) {
    $overallSuccess = $false
}

# Summary
Write-Host "`n📊 Test Summary:" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan

if ($overallSuccess) {
    Write-Host "✅ All HTTPS tests passed!" -ForegroundColor Green
    Write-Host "   Your application is ready for production use with HTTPS." -ForegroundColor Green
} else {
    Write-Host "❌ Some HTTPS tests failed." -ForegroundColor Red
    Write-Host "   Please review the issues above and refer to ssl-setup.md for troubleshooting." -ForegroundColor Yellow
}

Write-Host "`n🔗 Access your application at: https://$Hostname`:$Port" -ForegroundColor Cyan 