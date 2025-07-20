# Local Registry CI/CD Setup Guide

This guide explains how to use your local container registry (`localhost:6500`) with GitHub Actions for your container orchestrator application.

## 🎯 **Overview**

Since GitHub Actions runs on remote servers, it cannot directly access your local `localhost:6500` registry. We've created several approaches to work around this limitation:

1. **Hybrid Approach**: GitHub Actions builds images and saves them as artifacts, then you download and load them locally
2. **Local Build Script**: Build and deploy everything locally using PowerShell scripts
3. **Self-Hosted Runner**: Run GitHub Actions on your local machine (advanced)

## 🚀 **Option 1: Hybrid Approach (Recommended)**

### **How it Works:**
1. GitHub Actions builds Docker images
2. Images are saved as artifacts
3. You download artifacts and load them into your local registry
4. Deploy to Kubernetes

### **Setup Steps:**

#### **1. Configure GitHub Secrets**
- Go to your repository → Settings → Secrets and variables → Actions
- Add `KUBE_CONFIG` secret (base64-encoded kubeconfig)

#### **2. Trigger the Pipeline**
- Push to `main` or `develop` branch
- GitHub Actions will run the `local-registry-ci.yml` workflow

#### **3. Download and Load Images**
After the pipeline completes:

```powershell
# Install GitHub CLI if not already installed
# https://cli.github.com/

# Get the run ID from GitHub Actions tab
# Then run:
.\load-images-to-registry.ps1 -RunId <run-id>
```

#### **4. Deploy to Kubernetes**
The deployment will happen automatically, or you can run:
```powershell
kubectl set image deployment/frontend-orchestrator frontend=localhost:6500/orchestrator-frontend:latest -n orchestrator
kubectl set image statefulset/backend-orchestrator backend=localhost:6500/orchestrator-backend:latest -n orchestrator
```

## 🚀 **Option 2: Local Build Script (Simplest)**

### **How it Works:**
- Everything runs locally on your machine
- Builds images and pushes to local registry
- Deploys to Kubernetes

### **Usage:**
```powershell
.\local-build-and-deploy.ps1
```

### **What it Does:**
1. Checks if Docker and kubectl are available
2. Verifies local registry is accessible
3. Builds backend and frontend images
4. Pushes images to `localhost:6500`
5. Deploys to Kubernetes
6. Performs health checks

## 🚀 **Option 3: Self-Hosted Runner (Advanced)**

### **Setup Self-Hosted Runner:**

#### **1. Create Runner Token**
- Go to repository → Settings → Actions → Runners
- Click "New self-hosted runner"
- Follow the setup instructions

#### **2. Install Runner on Your Machine**
```bash
# Download and configure the runner
# This will allow GitHub Actions to run on your local machine
# and access your local registry directly
```

#### **3. Update Workflow**
Modify `.github/workflows/local-registry-ci.yml`:
```yaml
runs-on: self-hosted  # Instead of ubuntu-latest
```

## 🔧 **Local Registry Setup**

### **Start Local Registry:**
```powershell
# Start the registry container
docker run -d -p 6500:5000 --name registry registry:2

# Or if you have a custom registry setup
# Follow your existing registry configuration
```

### **Verify Registry:**
```powershell
# Check if registry is accessible
Invoke-WebRequest -Uri "http://localhost:6500/v2/_catalog"

# Should return: {"repositories":[]}
```

## 📋 **Workflow Files**

### **1. `.github/workflows/local-registry-ci.yml`**
- Main workflow for local registry integration
- Builds images and saves as artifacts
- Deploys to Kubernetes

### **2. `.github/workflows/ci-cd.yml`**
- Original workflow (updated for local registry)
- Alternative approach

### **3. `.github/workflows/pr-check.yml`**
- Lightweight PR checks
- No image building

## 🛠️ **Scripts**

### **1. `load-images-to-registry.ps1`**
- Downloads artifacts from GitHub Actions
- Loads Docker images into local registry
- Requires GitHub CLI

### **2. `local-build-and-deploy.ps1`**
- Complete local build and deploy
- No GitHub Actions required
- Everything runs locally

### **3. `setup-ci-cd.ps1`**
- Generates Kubernetes configuration
- Sets up CI/CD secrets

## 🔄 **Workflow Process**

### **GitHub Actions Pipeline:**
1. **Test Stage**: Lint and test code
2. **Build Stage**: Build Docker images
3. **Artifact Stage**: Save images as artifacts
4. **Deploy Stage**: Deploy to Kubernetes
5. **Security Stage**: Vulnerability scanning

### **Local Process:**
1. **Download**: Get artifacts from GitHub Actions
2. **Load**: Load images into local registry
3. **Deploy**: Update Kubernetes deployments

## 🚨 **Troubleshooting**

### **Common Issues:**

#### **1. Registry Not Accessible**
```powershell
# Check if registry is running
docker ps | findstr registry

# Start registry if needed
docker run -d -p 6500:5000 --name registry registry:2
```

#### **2. Images Not Loading**
```powershell
# Check artifact download
ls temp-artifacts/docker-images/

# Verify image files exist
ls *.tar
```

#### **3. Kubernetes Deployment Fails**
```powershell
# Check pod status
kubectl get pods -n orchestrator

# Check pod events
kubectl describe pod <pod-name> -n orchestrator

# Check logs
kubectl logs <pod-name> -n orchestrator
```

#### **4. GitHub CLI Not Found**
```powershell
# Install GitHub CLI
# https://cli.github.com/

# Or use manual download from GitHub Actions UI
```

## 📊 **Monitoring**

### **Pipeline Status:**
- Check GitHub Actions tab for pipeline status
- Monitor artifact downloads
- Verify image loading

### **Application Status:**
```powershell
# Check pod status
kubectl get pods -n orchestrator

# Check services
kubectl get services -n orchestrator

# Check ingress
kubectl get ingress -n orchestrator
```

## 🔐 **Security Considerations**

### **Local Registry Security:**
- Registry runs on localhost (insecure by default)
- Consider adding authentication for production
- Use HTTPS for external access

### **Secrets Management:**
- Kubernetes config stored as GitHub secret
- Base64 encoded for security
- Rotate secrets regularly

## 📈 **Best Practices**

### **1. Image Tagging:**
- Use semantic versioning
- Tag with commit SHA for traceability
- Keep `latest` tag for convenience

### **2. Registry Management:**
- Regular cleanup of old images
- Monitor registry storage
- Backup important images

### **3. Deployment Strategy:**
- Use rolling updates
- Monitor deployment health
- Have rollback procedures

## 🎯 **Next Steps**

1. **Choose your approach** (Hybrid, Local, or Self-hosted)
2. **Set up GitHub secrets** (KUBE_CONFIG)
3. **Test the pipeline** with a small change
4. **Monitor and optimize** the process
5. **Set up monitoring** and alerts

## 📚 **Useful Commands**

### **Registry Management:**
```powershell
# List images in registry
Invoke-WebRequest -Uri "http://localhost:6500/v2/_catalog"

# Delete image from registry
Invoke-WebRequest -Uri "http://localhost:6500/v2/orchestrator-backend/manifests/latest" -Method DELETE
```

### **Kubernetes Management:**
```powershell
# Update deployment
kubectl set image deployment/frontend-orchestrator frontend=localhost:6500/orchestrator-frontend:latest -n orchestrator

# Rollback deployment
kubectl rollout undo deployment/frontend-orchestrator -n orchestrator

# Check rollout status
kubectl rollout status deployment/frontend-orchestrator -n orchestrator
```

### **Docker Management:**
```powershell
# Build image
docker build -t localhost:6500/orchestrator-backend:latest ./backend_orchestrator

# Push image
docker push localhost:6500/orchestrator-backend:latest

# Load image from tar
docker load -i backend-image.tar
``` 