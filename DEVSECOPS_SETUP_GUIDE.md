# 🔒 DevSecOps Setup Guide for Orchestrator

## 📋 Overview

This guide sets up a comprehensive DevSecOps pipeline using GitHub Actions, Trivy, and SonarQube for security scanning and code quality analysis.

## 🚀 Pipeline Components

### 1. **Security Scanning (Trivy)**
- **Filesystem Scan**: Scans source code for vulnerabilities
- **Container Scan**: Scans Docker images for security issues
- **SARIF Reports**: Uploads results to GitHub Security tab

### 2. **Code Quality (SonarQube)**
- **Code Analysis**: Identifies code smells and technical debt
- **Security Hotspots**: Detects potential security vulnerabilities
- **Quality Gates**: Enforces quality standards

### 3. **Container Security**
- **Image Scanning**: Scans built Docker images
- **Vulnerability Detection**: Identifies critical and high severity issues
- **Secure Deployment**: Only deploys scanned images

## 🔧 Setup Instructions

### Step 1: GitHub Secrets Configuration

Add these secrets to your GitHub repository:

```bash
# Required Secrets
DOCKER_HUB_USERNAME=cybermonta
DOCKER_HUB_TOKEN=your-dockerhub-token

# SonarQube Configuration
SONAR_TOKEN=your-sonarqube-token
SONAR_HOST_URL=http://your-sonarqube-url:9000

# ArgoCD Configuration (if using)
ARGOCD_SERVER=your-argocd-server
ARGOCD_USERNAME=admin
ARGOCD_PASSWORD=your-argocd-password
```

### Step 2: SonarQube Setup

**A. Access SonarQube in your cluster:**
```bash
kubectl port-forward svc/sonarqube 9000:9000 -n sonarqube
# Open http://localhost:9000
```

**B. Create a project and generate token:**
1. Login with admin/admin
2. Create new project: "orchestrator"
3. Generate token in User > Security
4. Add token to GitHub secrets as `SONAR_TOKEN`

**C. Update SonarQube host URL:**
```bash
# Get SonarQube service IP
kubectl get svc sonarqube -n sonarqube
# Update SONAR_HOST_URL secret with: http://<IP>:9000
```

### Step 3: Pipeline Execution

**A. Trigger the pipeline:**
```bash
# Push to main branch or create PR
git add .
git commit -m "Enable DevSecOps pipeline"
git push origin main
```

**B. Monitor pipeline execution:**
1. Go to GitHub Actions tab
2. Watch the DevSecOps pipeline
3. Check each job status

## 📊 Security Reports

### 1. **Trivy Reports**
- **Location**: GitHub Security tab
- **Format**: SARIF
- **Content**: Vulnerability details with severity levels

### 2. **SonarQube Reports**
- **Location**: SonarQube UI
- **Content**: Code quality metrics and security hotspots

### 3. **Pipeline Summary**
- **Location**: GitHub Actions run summary
- **Content**: Overall security status and next steps

## 🔍 Pipeline Stages

### Stage 1: Security Scan
```yaml
- Filesystem vulnerability scan (Trivy)
- Upload SARIF results to GitHub
- Fail on critical vulnerabilities
```

### Stage 2: Code Quality
```yaml
- SonarQube analysis
- Quality gate validation
- Security hotspot detection
```

### Stage 3: Build & Scan
```yaml
- Build Docker images
- Scan container images (Trivy)
- Upload container scan results
- Push secure images
```

### Stage 4: Deployment
```yaml
- Update Kubernetes manifests
- Sync with ArgoCD
- Deploy secure application
```

## 🛡️ Security Gates

The pipeline will **FAIL** if:
- Critical vulnerabilities found in code
- Critical vulnerabilities found in container images
- SonarQube quality gate fails
- High severity security hotspots detected

## 📈 Monitoring & Alerts

### 1. **GitHub Security Tab**
- View all vulnerability reports
- Track remediation progress
- Set up Dependabot alerts

### 2. **SonarQube Dashboard**
- Monitor code quality trends
- Track technical debt
- Review security hotspots

### 3. **Pipeline Notifications**
- Email notifications on failures
- Slack integration (optional)
- Status checks for PRs

## 🔧 Troubleshooting

### Common Issues

**1. SonarQube Connection Failed:**
```bash
# Check SonarQube service
kubectl get svc sonarqube -n sonarqube
kubectl logs deployment/sonarqube -n sonarqube

# Verify token and URL
echo $SONAR_TOKEN
echo $SONAR_HOST_URL
```

**2. Trivy Scan Failures:**
```bash
# Check Trivy logs
kubectl logs deployment/trivy -n trivy-system

# Manual Trivy test
docker run --rm -v $(pwd):/workspace aquasec/trivy fs /workspace
```

**3. Docker Build Issues:**
```bash
# Check Docker Hub credentials
docker login -u cybermonta

# Test image build locally
docker build -t test-backend backend_orchestrator
```

## 🚀 Advanced Configuration

### 1. **Custom Security Policies**
```yaml
# Add to sonar-project.properties
sonar.security.hotspots.only=HIGH,CRITICAL
sonar.qualitygate.wait=true
```

### 2. **Trivy Configuration**
```yaml
# Custom severity levels
severity: 'CRITICAL,HIGH,MEDIUM'
ignore-unfixed: false
```

### 3. **Quality Gates**
```yaml
# SonarQube quality gate criteria
- Security Rating: A
- Vulnerability Count: 0
- Code Coverage: >80%
```

## 📞 Support

### Resources
- **GitHub Actions**: [Documentation](https://docs.github.com/en/actions)
- **Trivy**: [Documentation](https://trivy.dev/)
- **SonarQube**: [Documentation](https://docs.sonarqube.org/)

### Pipeline Status
Monitor your DevSecOps pipeline health:
```bash
# Check recent runs
gh run list --workflow=devsecops-pipeline.yml

# View specific run
gh run view <run-id>
```

## 🎯 Success Metrics

### Security Metrics
- ✅ Zero critical vulnerabilities
- ✅ Security rating A or B
- ✅ 100% security policy compliance

### Quality Metrics
- ✅ Code coverage >80%
- ✅ Technical debt <5%
- ✅ Code smells <10 per 1000 lines

This DevSecOps setup ensures your application is deployed with enterprise-grade security and quality standards!


