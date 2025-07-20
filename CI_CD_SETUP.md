# CI/CD Setup Guide for Container Orchestrator

This guide explains how to set up continuous integration and deployment for your container orchestrator application using GitHub Actions or GitLab CI.

## 🚀 Overview

The CI/CD pipeline includes:
- **Testing**: Linting and unit tests for both frontend and backend
- **Building**: Docker image creation and pushing to container registry
- **Deployment**: Automatic deployment to Kubernetes cluster
- **Security**: Vulnerability scanning with Trivy
- **Monitoring**: Health checks and deployment status

## 📋 Prerequisites

### For GitHub Actions:
1. **GitHub Repository**: Your code must be in a GitHub repository
2. **GitHub Container Registry**: For storing Docker images
3. **Kubernetes Cluster**: Accessible from GitHub Actions
4. **Secrets**: Configured in your GitHub repository

### For GitLab CI:
1. **GitLab Repository**: Your code must be in a GitLab repository
2. **GitLab Container Registry**: For storing Docker images
3. **Kubernetes Cluster**: Accessible from GitLab CI
4. **Variables**: Configured in your GitLab project

## 🔧 GitHub Actions Setup

### 1. Repository Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add these secrets:

```bash
# Kubernetes Configuration
KUBE_CONFIG=<base64-encoded-kubeconfig>

# Optional: Custom Registry (if not using GitHub Container Registry)
REGISTRY_USERNAME=<your-registry-username>
REGISTRY_PASSWORD=<your-registry-password>
```

### 2. Generate Kubernetes Config

```bash
# Get your current kubeconfig
kubectl config view --raw

# Encode it for GitHub Secrets
kubectl config view --raw | base64 -w 0
```

### 3. Workflow Files

The following workflow files are already created:

- `.github/workflows/ci-cd.yml` - Main CI/CD pipeline
- `.github/workflows/pr-check.yml` - Pull request checks

### 4. Branch Protection (Recommended)

1. Go to Settings → Branches
2. Add rule for `main` branch
3. Enable:
   - Require status checks to pass
   - Require branches to be up to date
   - Require pull request reviews

## 🔧 GitLab CI Setup

### 1. Project Variables

Go to your GitLab project → Settings → CI/CD → Variables, and add:

```bash
# Kubernetes Configuration
KUBE_CONFIG=<base64-encoded-kubeconfig>

# Registry Variables (usually auto-configured)
CI_REGISTRY_USER=<your-registry-username>
CI_REGISTRY_PASSWORD=<your-registry-password>
```

### 2. GitLab CI File

The `.gitlab-ci.yml` file is already configured with:
- Multi-stage pipeline (test, build, deploy, security)
- Docker-in-Docker for building images
- Kubernetes deployment
- Security scanning

## 🏗️ Pipeline Stages

### 1. Test Stage
- **Backend Testing**: Linting and unit tests
- **Frontend Testing**: Linting and unit tests
- **Parallel Execution**: Both run simultaneously

### 2. Build Stage
- **Docker Build**: Multi-stage builds for both services
- **Image Tagging**: SHA-based and latest tags
- **Registry Push**: Automatic push to container registry

### 3. Deploy Stage
- **Kubernetes Deployment**: Apply manifests and update images
- **Rollout Monitoring**: Wait for successful deployment
- **Health Checks**: Verify pods are ready

### 4. Security Stage
- **Code Scanning**: Trivy vulnerability scanning
- **Container Scanning**: Image vulnerability analysis
- **Report Generation**: Security reports for review

## 🔄 Workflow Triggers

### GitHub Actions:
- **Push to main/develop**: Full CI/CD pipeline
- **Pull Request**: Test and security scan only
- **Manual**: Can be triggered manually

### GitLab CI:
- **Push to main/develop**: Full pipeline
- **Merge Request**: Test and security scan
- **Manual**: Can be triggered manually

## 🐳 Container Registry

### GitHub Container Registry (ghcr.io)
```bash
# Images will be pushed to:
ghcr.io/<your-username>/orchestrator-backend:latest
ghcr.io/<your-username>/orchestrator-frontend:latest
```

### GitLab Container Registry
```bash
# Images will be pushed to:
registry.gitlab.com/<your-group>/<your-project>/orchestrator-backend:latest
registry.gitlab.com/<your-group>/<your-project>/orchestrator-frontend:latest
```

## 🔐 Security Features

### 1. Vulnerability Scanning
- **Trivy Integration**: Scans code and containers
- **Security Reports**: Available in CI/CD interface
- **Fail on High Severity**: Configurable security thresholds

### 2. Secrets Management
- **Encrypted Secrets**: Stored securely in platform
- **No Hardcoded Values**: All sensitive data in variables
- **Rotation Support**: Easy secret rotation

### 3. Access Control
- **Branch Protection**: Prevents direct pushes to main
- **Required Reviews**: Code review before merge
- **Status Checks**: Ensures all tests pass

## 📊 Monitoring and Alerts

### 1. Pipeline Monitoring
- **Success/Failure Notifications**: Email/Slack integration
- **Deployment Status**: Real-time deployment tracking
- **Rollback Capability**: Quick rollback on failure

### 2. Application Monitoring
- **Health Checks**: Kubernetes readiness/liveness probes
- **Log Aggregation**: Centralized logging
- **Metrics Collection**: Performance monitoring

## 🛠️ Customization

### 1. Environment-Specific Deployments
```yaml
# Add environment-specific variables
staging:
  NAMESPACE: orchestrator-staging
  DOMAIN: staging.orchestrator.local

production:
  NAMESPACE: orchestrator-production
  DOMAIN: orchestrator.local
```

### 2. Custom Test Commands
```yaml
# Modify test commands in workflow files
- name: Run backend tests
  run: |
    npm ci
    npm run test:coverage
    npm run test:integration
```

### 3. Additional Security Scans
```yaml
# Add more security tools
- name: Run OWASP ZAP
  uses: zaproxy/action-full-scan@v0.8.0
  with:
    target: 'https://orchestrator.local'
```

## 🚨 Troubleshooting

### Common Issues:

1. **Kubernetes Connection Failed**
   ```bash
   # Verify kubeconfig
   kubectl config view
   # Check cluster access
   kubectl cluster-info
   ```

2. **Docker Build Failed**
   ```bash
   # Check Dockerfile syntax
   docker build --no-cache .
   # Verify context
   ls -la backend_orchestrator/
   ```

3. **Registry Authentication Failed**
   ```bash
   # Test registry login
   docker login ghcr.io -u $GITHUB_USERNAME -p $GITHUB_TOKEN
   ```

4. **Deployment Timeout**
   ```bash
   # Check pod status
   kubectl get pods -n orchestrator
   # Check events
   kubectl describe pod <pod-name> -n orchestrator
   ```

## 📈 Best Practices

### 1. Code Quality
- **Linting**: Enforce code style consistency
- **Testing**: Maintain high test coverage
- **Code Review**: Require peer reviews

### 2. Security
- **Regular Scans**: Automated vulnerability scanning
- **Secret Rotation**: Regular secret updates
- **Access Control**: Principle of least privilege

### 3. Deployment
- **Blue-Green**: Zero-downtime deployments
- **Rollback Strategy**: Quick rollback capability
- **Monitoring**: Comprehensive health monitoring

### 4. Performance
- **Caching**: Cache dependencies and layers
- **Parallel Jobs**: Run independent tasks in parallel
- **Resource Limits**: Set appropriate resource constraints

## 🔗 Useful Links

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitLab CI/CD Documentation](https://docs.gitlab.com/ee/ci/)
- [Trivy Security Scanner](https://aquasecurity.github.io/trivy/)
- [Kubernetes Deployment Best Practices](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)

## 📝 Next Steps

1. **Configure Secrets**: Set up required secrets/variables
2. **Test Pipeline**: Run a test deployment
3. **Set Up Monitoring**: Configure alerts and monitoring
4. **Document Procedures**: Create runbooks for your team
5. **Security Review**: Conduct security assessment
6. **Performance Optimization**: Optimize build and deployment times 