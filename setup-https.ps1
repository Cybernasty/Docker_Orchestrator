# HTTPS Setup Script for Docker Orchestrator
# This script automates the setup of HTTPS with CA-signed certificates

param(
    [string]$CertPath = "",
    [string]$KeyPath = "",
    [string]$CaPath = "",
    [string]$Passphrase = "",
    [switch]$EnableHttps = $false,
    [switch]$Help = $false
)

# Show help if requested
if ($Help) {
    Write-Host @"
HTTPS Setup Script for Docker Orchestrator

Usage: .\setup-https.ps1 [options]

Options:
    -CertPath <path>     Path to your server certificate (.crt file)
    -KeyPath <path>      Path to your private key (.key file)
    -CaPath <path>       Path to your CA certificate (.crt file)
    -Passphrase <text>   SSL passphrase (if key is encrypted)
    -EnableHttps         Enable HTTPS mode
    -Help                Show this help message

Examples:
    .\setup-https.ps1 -CertPath "C:\certs\server.crt" -KeyPath "C:\certs\server.key" -CaPath "C:\certs\ca.crt" -EnableHttps
    .\setup-https.ps1 -Help
"@
    exit 0
}

# Function to check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Function to create SSL directory structure
function New-SslDirectory {
    Write-Host "📁 Creating SSL directory structure..." -ForegroundColor Green
    
    if (!(Test-Path "ssl")) {
        New-Item -ItemType Directory -Path "ssl" | Out-Null
        Write-Host "✅ Created ssl directory"
    }
    
    if (!(Test-Path "ssl\certs")) {
        New-Item -ItemType Directory -Path "ssl\certs" | Out-Null
        Write-Host "✅ Created ssl\certs directory"
    }
    
    if (!(Test-Path "ssl\private")) {
        New-Item -ItemType Directory -Path "ssl\private" | Out-Null
        Write-Host "✅ Created ssl\private directory"
    }
}

# Function to copy and validate certificates
function Copy-Certificates {
    param(
        [string]$CertPath,
        [string]$KeyPath,
        [string]$CaPath
    )
    
    Write-Host "📋 Copying certificates..." -ForegroundColor Green
    
    # Copy server certificate
    if ($CertPath -and (Test-Path $CertPath)) {
        Copy-Item $CertPath "ssl\server.crt" -Force
        Write-Host "✅ Copied server certificate"
    } else {
        Write-Host "⚠️  Server certificate not found or path not provided" -ForegroundColor Yellow
    }
    
    # Copy private key
    if ($KeyPath -and (Test-Path $KeyPath)) {
        Copy-Item $KeyPath "ssl\server.key" -Force
        Write-Host "✅ Copied private key"
    } else {
        Write-Host "⚠️  Private key not found or path not provided" -ForegroundColor Yellow
    }
    
    # Copy CA certificate
    if ($CaPath -and (Test-Path $CaPath)) {
        Copy-Item $CaPath "ssl\ca.crt" -Force
        Write-Host "✅ Copied CA certificate"
    } else {
        Write-Host "⚠️  CA certificate not found or path not provided" -ForegroundColor Yellow
    }
}

# Function to validate certificates
function Test-Certificates {
    Write-Host "🔍 Validating certificates..." -ForegroundColor Green
    
    $errors = @()
    
    # Check if certificates exist
    if (!(Test-Path "ssl\server.crt")) {
        $errors += "Server certificate (ssl\server.crt) not found"
    }
    
    if (!(Test-Path "ssl\server.key")) {
        $errors += "Private key (ssl\server.key) not found"
    }
    
    if (!(Test-Path "ssl\ca.crt")) {
        $errors += "CA certificate (ssl\ca.crt) not found"
    }
    
    # Validate certificate format (basic check)
    if (Test-Path "ssl\server.crt") {
        $certContent = Get-Content "ssl\server.crt" -Raw
        if ($certContent -notmatch "-----BEGIN CERTIFICATE-----") {
            $errors += "Server certificate format appears invalid"
        }
    }
    
    if (Test-Path "ssl\server.key") {
        $keyContent = Get-Content "ssl\server.key" -Raw
        if ($keyContent -notmatch "-----BEGIN PRIVATE KEY-----" -and $keyContent -notmatch "-----BEGIN RSA PRIVATE KEY-----") {
            $errors += "Private key format appears invalid"
        }
    }
    
    if ($errors.Count -gt 0) {
        Write-Host "❌ Certificate validation failed:" -ForegroundColor Red
        foreach ($error in $errors) {
            Write-Host "   - $error" -ForegroundColor Red
        }
        return $false
    } else {
        Write-Host "✅ All certificates validated successfully" -ForegroundColor Green
        return $true
    }
}

# Function to create environment file
function New-EnvironmentFile {
    param(
        [bool]$EnableHttps,
        [string]$Passphrase
    )
    
    Write-Host "⚙️  Creating environment configuration..." -ForegroundColor Green
    
    $envContent = @"
# Server Configuration
PORT=5000
NODE_ENV=production

# HTTPS Configuration
HTTPS_ENABLED=$($EnableHttps.ToString().ToLower())
HTTPS_PORT=5443
SSL_CERT_PATH=/etc/ssl/certs/server.crt
SSL_KEY_PATH=/etc/ssl/private/server.key
SSL_CA_PATH=/etc/ssl/certs/ca.crt
SSL_PASSPHRASE=$Passphrase

# Database Configuration
MONGO_URI=mongodb://mongo:27017/containersDB

# CORS Configuration
CORS_ORIGIN=https://localhost

# Docker Configuration
DOCKER_HOST=unix:///var/run/docker.sock

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Container Sync Interval (in milliseconds)
SYNC_INTERVAL=30000

# Logging
LOG_LEVEL=info

# WebSocket Configuration
WS_HEARTBEAT_INTERVAL=30000
WS_MAX_RECONNECT_ATTEMPTS=5
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ Created .env file with HTTPS configuration"
}

# Function to encode certificates for Kubernetes
function Convert-CertificatesForK8s {
    Write-Host "🔐 Encoding certificates for Kubernetes..." -ForegroundColor Green
    
    if (Test-Path "ssl\server.crt") {
        $serverCert = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((Get-Content "ssl\server.crt" -Raw)))
        Write-Host "✅ Server certificate encoded for Kubernetes"
        Write-Host "   Add this to k8s/secrets.yaml under ssl-certificates.data.server.crt"
    }
    
    if (Test-Path "ssl\server.key") {
        $serverKey = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((Get-Content "ssl\server.key" -Raw)))
        Write-Host "✅ Private key encoded for Kubernetes"
        Write-Host "   Add this to k8s/secrets.yaml under ssl-certificates.data.server.key"
    }
    
    if (Test-Path "ssl\ca.crt") {
        $caCert = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((Get-Content "ssl\ca.crt" -Raw)))
        Write-Host "✅ CA certificate encoded for Kubernetes"
        Write-Host "   Add this to k8s/secrets.yaml under ssl-certificates.data.ca.crt"
    }
}

# Function to test HTTPS setup
function Test-HttpsSetup {
    Write-Host "🧪 Testing HTTPS setup..." -ForegroundColor Green
    
    # Check if Docker is running
    try {
        docker version | Out-Null
        Write-Host "✅ Docker is running"
    } catch {
        Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
        return $false
    }
    
    # Check if certificates are accessible
    if (Test-Path "ssl\server.crt" -and Test-Path "ssl\server.key" -and Test-Path "ssl\ca.crt") {
        Write-Host "✅ All certificates are present"
    } else {
        Write-Host "❌ Some certificates are missing" -ForegroundColor Red
        return $false
    }
    
    Write-Host "✅ HTTPS setup validation completed" -ForegroundColor Green
    return $true
}

# Function to show next steps
function Show-NextSteps {
    param([bool]$EnableHttps)
    
    Write-Host "`n🚀 Next Steps:" -ForegroundColor Cyan
    
    if ($EnableHttps) {
        Write-Host @"
1. Deploy with HTTPS enabled:
   docker-compose -f docker-compose.ha.yml up -d

2. Test HTTPS endpoint:
   curl -k https://localhost/health

3. Test with CA verification:
   curl --cacert ssl/ca.crt https://localhost/health

4. For Kubernetes deployment:
   - Update k8s/secrets.yaml with encoded certificates
   - Run: kubectl apply -f k8s/

5. Verify WebSocket connections work over WSS
"@
    } else {
        Write-Host @"
1. Deploy without HTTPS:
   docker-compose up -d

2. To enable HTTPS later:
   - Set HTTPS_ENABLED=true in .env
   - Restart services: docker-compose restart
"@
    }
    
    Write-Host "`n📚 For detailed instructions, see ssl-setup.md" -ForegroundColor Yellow
}

# Main execution
Write-Host "🔒 HTTPS Setup for Docker Orchestrator" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Check if running as administrator (recommended for certificate operations)
if (!(Test-Administrator)) {
    Write-Host "⚠️  Warning: Not running as administrator. Some operations may fail." -ForegroundColor Yellow
}

# Create SSL directory structure
New-SslDirectory

# Copy certificates if provided
if ($CertPath -or $KeyPath -or $CaPath) {
    Copy-Certificates -CertPath $CertPath -KeyPath $KeyPath -CaPath $CaPath
}

# Validate certificates
$certValid = Test-Certificates

# Create environment file
New-EnvironmentFile -EnableHttps $EnableHttps -Passphrase $Passphrase

# Encode certificates for Kubernetes
if ($certValid) {
    Convert-CertificatesForK8s
}

# Test setup
$setupValid = Test-HttpsSetup

# Show next steps
Show-NextSteps -EnableHttps $EnableHttps

if ($setupValid) {
    Write-Host "`n✅ HTTPS setup completed successfully!" -ForegroundColor Green
} else {
    Write-Host "`n❌ HTTPS setup completed with warnings. Please review the issues above." -ForegroundColor Yellow
} 