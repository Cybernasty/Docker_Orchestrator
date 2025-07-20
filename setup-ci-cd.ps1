# CI/CD Setup Script for Container Orchestrator
# This script helps you set up the necessary configuration for CI/CD

Write-Host "CI/CD Setup for Container Orchestrator" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Check if kubectl is available
try {
    $kubectlVersion = kubectl version --client --short
    Write-Host "kubectl found: $kubectlVersion" -ForegroundColor Green
} catch {
    Write-Host "kubectl not found. Please install kubectl first." -ForegroundColor Red
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

Write-Host "`nGenerating Kubernetes Configuration..." -ForegroundColor Yellow

# Generate base64 encoded kubeconfig
try {
    $kubeconfig = kubectl config view --raw
    $kubeconfigBase64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($kubeconfig))
    
    Write-Host "Kubernetes config generated successfully" -ForegroundColor Green
    
    # Save to file
    $kubeconfigBase64 | Out-File -FilePath "kubeconfig-base64.txt" -Encoding UTF8
    Write-Host "Saved to: kubeconfig-base64.txt" -ForegroundColor Cyan
    
} catch {
    Write-Host "Failed to generate Kubernetes config: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`nCI/CD Configuration Summary:" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow

Write-Host "`nGitHub Actions Setup:" -ForegroundColor Cyan
Write-Host "1. Go to your GitHub repository -> Settings -> Secrets and variables -> Actions"
Write-Host "2. Add the following secret:"
Write-Host "   Name: KUBE_CONFIG"
Write-Host "   Value: (copy from kubeconfig-base64.txt)"
Write-Host "3. Optional: Add registry credentials if using custom registry"

Write-Host "`nGitLab CI Setup:" -ForegroundColor Cyan
Write-Host "1. Go to your GitLab project -> Settings -> CI/CD -> Variables"
Write-Host "2. Add the following variable:"
Write-Host "   Key: KUBE_CONFIG"
Write-Host "   Value: (copy from kubeconfig-base64.txt)"
Write-Host "   Type: Variable"
Write-Host "   Protected: Yes"
Write-Host "   Masked: Yes"

Write-Host "`nSecurity Recommendations:" -ForegroundColor Yellow
Write-Host "1. Enable branch protection rules"
Write-Host "2. Require pull request reviews"
Write-Host "3. Set up security scanning alerts"
Write-Host "4. Regularly rotate secrets"

Write-Host "`nMonitoring Setup:" -ForegroundColor Yellow
Write-Host "1. Configure deployment notifications"
Write-Host "2. Set up health check monitoring"
Write-Host "3. Enable log aggregation"
Write-Host "4. Configure performance metrics"

Write-Host "`nNext Steps:" -ForegroundColor Green
Write-Host "1. Push your code to GitHub/GitLab"
Write-Host "2. Configure the secrets/variables as shown above"
Write-Host "3. Create a test branch and push to trigger the pipeline"
Write-Host "4. Monitor the pipeline execution"
Write-Host "5. Review security scan results"

Write-Host "`nDocumentation:" -ForegroundColor Cyan
Write-Host "• CI_CD_SETUP.md - Detailed setup guide"
Write-Host "• .github/workflows/ - GitHub Actions workflows"
Write-Host "• .gitlab-ci.yml - GitLab CI configuration"

Write-Host "`nSetup complete! Check the generated files and follow the next steps." -ForegroundColor Green

# Display the base64 config for easy copying
Write-Host "`nYour Kubernetes Config (Base64):" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host $kubeconfigBase64 -ForegroundColor White
Write-Host "`nCopy this value to your CI/CD platform secrets/variables" -ForegroundColor Cyan 