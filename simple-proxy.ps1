Write-Host "Setting up simple reverse proxy for single URL access..." -ForegroundColor Yellow

# Create a simple Node.js reverse proxy
$proxyScript = @"
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3000;

// Serve static files from frontend
app.use('/', createProxyMiddleware({
  target: 'http://localhost:8080',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api'  // Keep /api path for backend
  }
}));

// Proxy API requests to backend
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api'  // Keep /api path
  }
}));

app.listen(PORT, () => {
  console.log('Reverse proxy running on http://localhost:3000');
  console.log('Frontend: http://localhost:8080');
  console.log('Backend API: http://localhost:5000');
});
"@

# Create package.json for the proxy
$packageJson = @"
{
  "name": "orchestrator-proxy",
  "version": "1.0.0",
  "main": "proxy.js",
  "dependencies": {
    "express": "^4.18.2",
    "http-proxy-middleware": "^2.0.6"
  },
  "scripts": {
    "start": "node proxy.js"
  }
}
"@

# Create proxy directory and files
$proxyDir = "proxy"
if (-not (Test-Path $proxyDir)) {
    New-Item -ItemType Directory -Path $proxyDir | Out-Null
}

$proxyScript | Out-File -FilePath "$proxyDir\proxy.js" -Encoding UTF8
$packageJson | Out-File -FilePath "$proxyDir\package.json" -Encoding UTF8

Write-Host "Proxy files created in $proxyDir" -ForegroundColor Green
Write-Host "To start the proxy:" -ForegroundColor Yellow
Write-Host "1. cd $proxyDir" -ForegroundColor Cyan
Write-Host "2. npm install" -ForegroundColor Cyan
Write-Host "3. npm start" -ForegroundColor Cyan
Write-Host "4. Access your app at: http://localhost:3000" -ForegroundColor Green 