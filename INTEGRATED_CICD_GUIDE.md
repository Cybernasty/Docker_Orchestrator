# 🔒 Integrated DevSecOps CI/CD Pipeline Guide

## 📋 Overview

This guide explains the complete DevSecOps CI/CD pipeline that integrates:
- **SonarQube** for code quality and security analysis
- **Trivy** for vulnerability scanning (filesystem + containers)
- **ArgoCD** for GitOps-based deployment
- **Docker Hub** for container registry
- **GitHub Actions** for CI/CD automation

---

## 🎯 Pipeline Architecture

### **Pipeline Flow:**

```
┌─────────────────────────────────────────────────────────────────┐
│  1. CODE QUALITY & SECURITY ANALYSIS                            │
│     ├── SonarQube: Code quality, bugs, security hotspots        │
│     └── Trivy: Filesystem vulnerability scanning                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  2. BUILD & CONTAINER SECURITY                                  │
│     ├── Build Docker images (Backend + Frontend)                │
│     ├── Trivy: Container image vulnerability scanning           │
│     └── Push to Docker Hub (if secure)                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  3. UPDATE MANIFESTS FOR GITOPS                                 │
│     ├── Update Kubernetes manifest image tags                   │
│     └── Commit changes to Git repository                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  4. ARGOCD DEPLOYMENT                                           │
│     ├── ArgoCD detects Git changes                              │
│     ├── Sync application to Kubernetes                          │
│     └── Verify deployment health                                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  5. POST-DEPLOYMENT VERIFICATION                                │
│     ├── Verify running containers                               │
│     └── Security check on deployed pods                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### **Prerequisites:**

1. ✅ **GitHub Repository** with your code
2. ✅ **Docker Hub Account** (username: `cybermonta`)
3. ✅ **SonarQube Server** deployed
4. ✅ **ArgoCD** installed on Kubernetes cluster
5. ✅ **Self-Hosted GitHub Runner** (for local cluster access)

### **Step 1: Configure GitHub Secrets**

Go to your repository → **Settings** → **Secrets and variables** → **Actions** and add:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DOCKER_HUB_USERNAME` | Docker Hub username | `cybermonta` |
| `DOCKER_HUB_TOKEN` | Docker Hub access token | `dckr_pat_...` |
| `SONAR_TOKEN` | SonarQube authentication token | `squ_...` |
| `SONAR_HOST_URL` | SonarQube server URL | `http://192.168.11.143:30900` |
| `ARGOCD_SERVER` | ArgoCD server address | `192.168.11.143:30443` |
| `ARGOCD_USERNAME` | ArgoCD username | `admin` |
| `ARGOCD_PASSWORD` | ArgoCD password | `your-password` |

### **Step 2: Update ArgoCD Application**

Update `k8s/argocd-application.yaml` with your actual GitHub repository URL:

```yaml
source:
  repoURL: https://github.com/YOUR-USERNAME/Orchestrator.git
```

### **Step 3: Enable the Pipeline**

The pipeline is triggered automatically on:
- ✅ **Push to `main`** branch (full pipeline with deployment)
- ✅ **Push to `develop`** branch (build and scan, no deployment)
- ✅ **Pull requests** to `main` (analysis only)
- ✅ **Manual trigger** via GitHub Actions UI

### **Step 4: Monitor Pipeline Execution**

Go to **Actions** tab in your GitHub repository to see:
- 📊 Real-time pipeline progress
- 🔍 Security scan results
- 📈 Code quality metrics
- 🚀 Deployment status

---

## 🛡️ Security Scanning Details

### **1. SonarQube Code Quality Analysis**

**What it scans:**
- 🐛 Bugs and code smells
- 🔒 Security hotspots and vulnerabilities
- 📊 Code coverage and technical debt
- 🎯 Code duplication and complexity

**Quality Gate:**
- Pipeline fails if quality gate does not pass
- Configurable thresholds in SonarQube UI

**View Results:**
```
SonarQube UI → Projects → Orchestrator
```

### **2. Trivy Filesystem Scan**

**What it scans:**
- 📦 npm/pip dependencies vulnerabilities
- 📝 Configuration files (JSON, YAML)
- 🔐 Secrets in source code
- 📄 IaC misconfigurations

**Severity Levels:**
- `CRITICAL`: Blocks deployment on main branch
- `HIGH`: Reported but doesn't block
- `MEDIUM`: Informational

**View Results:**
```
GitHub → Security → Code scanning alerts → Filesystem
```

### **3. Trivy Container Image Scan**

**What it scans:**
- 🐳 Docker image layers
- 📦 OS packages (apt, yum, apk)
- 🔧 Application dependencies
- ⚙️ Binary vulnerabilities

**Security Policy:**
- Critical vulnerabilities **block deployment** to production
- All results uploaded to GitHub Security tab
- SARIF format for detailed reporting

**View Results:**
```
GitHub → Security → Code scanning alerts → Backend/Frontend Image
```

---

## 🔄 GitOps with ArgoCD

### **How It Works:**

1. **Pipeline updates manifests** in `k8s/` directory with new image tags
2. **Git commit** is created automatically with message: `🚀 Update image tags to <tag> [skip ci]`
3. **ArgoCD detects** Git changes (polls every 3 minutes)
4. **ArgoCD syncs** application to match Git state
5. **Kubernetes deploys** new versions with rolling updates

### **ArgoCD Configuration:**

The ArgoCD application is defined in `k8s/argocd-application.yaml`:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: orchestrator-app
spec:
  project: default
  source:
    repoURL: https://github.com/your-username/Orchestrator.git
    path: k8s
  destination:
    namespace: orchestrator
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

**Key Features:**
- ✅ **Automated Sync**: Deploys changes automatically
- ✅ **Self-Healing**: Reverts manual cluster changes
- ✅ **Pruning**: Deletes resources removed from Git
- ✅ **Rollback**: Easy revert to previous versions

### **Manual ArgoCD Operations:**

```bash
# Login to ArgoCD
argocd login 192.168.11.143:30443 --username admin --password <password> --insecure

# Sync application manually
argocd app sync orchestrator-app

# Check application status
argocd app get orchestrator-app

# View sync history
argocd app history orchestrator-app

# Rollback to previous version
argocd app rollback orchestrator-app <revision-number>
```

---

## 🐳 Docker Hub Integration

### **Image Naming Convention:**

```
cybermonta/orchestrator-backend:<branch>-<short-sha>
cybermonta/orchestrator-frontend:<branch>-<short-sha>
```

**Examples:**
- `cybermonta/orchestrator-backend:main-a1b2c3d`
- `cybermonta/orchestrator-backend:latest`

### **Image Tags:**

| Tag | Description | When Created |
|-----|-------------|--------------|
| `<branch>-<sha>` | Specific version | Every commit |
| `latest` | Latest main branch | Main branch push |

### **Docker Hub Setup:**

1. **Create Access Token:**
   ```
   Docker Hub → Account Settings → Security → New Access Token
   ```

2. **Add to GitHub Secrets:**
   ```
   DOCKER_HUB_USERNAME: cybermonta
   DOCKER_HUB_TOKEN: <your-access-token>
   ```

3. **View Images:**
   ```
   https://hub.docker.com/r/cybermonta/orchestrator-backend
   https://hub.docker.com/r/cybermonta/orchestrator-frontend
   ```

---

## 📊 Pipeline Phases Explained

### **Phase 1: Code Quality & Security Analysis**

**Jobs:**
- `code-quality`: SonarQube analysis with quality gate check
- `filesystem-security-scan`: Trivy filesystem vulnerability scan

**When it runs:**
- ✅ All branches
- ✅ All pull requests
- ✅ Manual triggers

**What happens:**
1. Checkout code
2. Install dependencies
3. Run tests with coverage
4. SonarQube scan
5. Quality gate check
6. Trivy filesystem scan
7. Upload results to GitHub Security

**Duration:** ~5-10 minutes

---

### **Phase 2: Build & Container Security**

**Jobs:**
- `build-and-scan-images`: Build Docker images and scan for vulnerabilities

**When it runs:**
- ✅ `main` and `develop` branches only
- ❌ Pull requests (skip)

**What happens:**
1. Generate unique image tags
2. Build backend Docker image
3. Build frontend Docker image
4. Trivy scan on both images
5. Upload scan results to GitHub Security
6. Check for critical vulnerabilities
7. Push images to Docker Hub (if secure)

**Duration:** ~10-15 minutes

**Security Policy:**
- Critical vulnerabilities **block** main branch deployment
- Develop branch: vulnerabilities reported but don't block

---

### **Phase 3: Update Manifests**

**Jobs:**
- `update-manifests`: Update Kubernetes YAML files with new image tags

**When it runs:**
- ✅ `main` branch only

**What happens:**
1. Checkout code
2. Update `k8s/backend-deployment.yaml` with new image tag
3. Update `k8s/frontend-deployment.yaml` with new image tag
4. Commit changes to Git
5. Push to repository (triggers ArgoCD)

**Duration:** ~1 minute

**Commit Message:**
```
🚀 Update image tags to main-a1b2c3d [skip ci]
```

The `[skip ci]` tag prevents infinite pipeline loops.

---

### **Phase 4: ArgoCD Deployment**

**Jobs:**
- `deploy-with-argocd`: Sync application using ArgoCD

**When it runs:**
- ✅ `main` branch only (after manifest update)

**What happens:**
1. Install/verify ArgoCD CLI
2. Login to ArgoCD server
3. Sync application to Kubernetes
4. Wait for sync completion (timeout: 10 minutes)
5. Get application status
6. Verify pod deployment

**Duration:** ~5-10 minutes

**Deployment Strategy:**
- Rolling update (zero downtime)
- Health checks on all pods
- Automatic rollback on failure

---

### **Phase 5: Post-Deployment Verification**

**Jobs:**
- `post-deployment-scan`: Verify running containers

**When it runs:**
- ✅ After successful ArgoCD deployment

**What happens:**
1. Verify running image versions
2. Check pod security status
3. Generate deployment report

**Duration:** ~1 minute

---

### **Phase 6: Pipeline Summary**

**Jobs:**
- `pipeline-summary`: Generate complete execution report

**When it runs:**
- ✅ Always (even if previous jobs fail)

**What happens:**
1. Collect results from all phases
2. Generate summary table
3. Create GitHub Actions summary
4. Provide next steps

**Duration:** ~10 seconds

---

## 🔍 Monitoring & Troubleshooting

### **View Pipeline Status**

```bash
# Via GitHub Actions UI
# Go to: https://github.com/YOUR-USERNAME/Orchestrator/actions

# View specific workflow run
# Click on any workflow run to see detailed logs
```

### **Common Issues & Solutions**

#### **Issue 1: SonarQube Quality Gate Failed**

**Symptoms:**
- Pipeline fails at `code-quality` job
- Error: "Quality Gate failed"

**Solution:**
```bash
# View SonarQube dashboard
# Fix reported issues (bugs, code smells, security hotspots)
# Push fixes and rerun pipeline
```

---

#### **Issue 2: Critical Vulnerabilities Found**

**Symptoms:**
- Pipeline fails at `build-and-scan-images` job
- Error: "Critical vulnerabilities found"

**Solution:**
```bash
# View GitHub Security tab for details
# Update vulnerable dependencies
# Example for npm:
cd backend_orchestrator
npm audit fix
npm audit fix --force  # if needed

cd ../frontend_orchestrator
npm audit fix
```

---

#### **Issue 3: ArgoCD Sync Failed**

**Symptoms:**
- Pipeline fails at `deploy-with-argocd` job
- Error: "Sync failed" or "Health check timeout"

**Solution:**
```bash
# Check ArgoCD UI for details
kubectl get application orchestrator-app -n argocd -o yaml

# Check pod status
kubectl get pods -n orchestrator

# Check pod logs
kubectl logs -n orchestrator <pod-name>

# Manual sync with ArgoCD
argocd app sync orchestrator-app --prune --force
```

---

#### **Issue 4: Docker Hub Push Failed**

**Symptoms:**
- Error: "denied: requested access to the resource is denied"

**Solution:**
```bash
# Verify Docker Hub credentials
# Regenerate access token if needed
# Update GitHub secrets:
# - DOCKER_HUB_USERNAME
# - DOCKER_HUB_TOKEN
```

---

#### **Issue 5: Self-Hosted Runner Offline**

**Symptoms:**
- Jobs stuck in "Queued" state
- Error: "No runner available"

**Solution:**
```bash
# Check runner status on GitHub
# Settings → Actions → Runners

# Restart runner on your machine
cd actions-runner
./run.sh  # Linux/Mac
./run.cmd  # Windows

# Or install runner as service
sudo ./svc.sh install
sudo ./svc.sh start
```

---

## 📈 Best Practices

### **1. Branch Strategy**

```
main (production)
  ├── Full pipeline with deployment
  └── Critical vulnerabilities block deployment

develop (staging)
  ├── Build and scan
  └── No automatic deployment

feature/* (development)
  └── Code quality and filesystem scan only
```

### **2. Commit Messages**

Use conventional commits for better tracking:

```bash
feat: Add new container management feature
fix: Resolve memory leak in backend
security: Update vulnerable dependencies
chore: Update ArgoCD configuration
```

### **3. Security Scanning Schedule**

- **On every push**: Filesystem and code quality scan
- **On main/develop push**: Container image scan
- **Weekly scheduled**: Full security audit (optional)

### **4. Quality Gates**

Configure SonarQube quality gates:

```yaml
Conditions:
- Code Coverage: > 80%
- Duplicated Lines: < 3%
- Maintainability Rating: A
- Security Rating: A
- Reliability Rating: A
```

### **5. Rollback Strategy**

If issues are detected after deployment:

```bash
# Option 1: Rollback via ArgoCD
argocd app rollback orchestrator-app <previous-revision>

# Option 2: Rollback via Git
git revert <commit-hash>
git push

# Option 3: Manual rollback via kubectl
kubectl rollout undo deployment/frontend-orchestrator -n orchestrator
kubectl rollout undo statefulset/backend-orchestrator -n orchestrator
```

---

## 🎯 Performance Optimization

### **Pipeline Speed:**

| Phase | Typical Duration | Optimization Tips |
|-------|------------------|-------------------|
| Code Quality | 5-10 min | Use incremental analysis |
| Filesystem Scan | 2-3 min | Cache dependencies |
| Image Build | 10-15 min | Use Docker layer caching |
| Image Scan | 5-7 min | Scan only changed layers |
| Deployment | 5-10 min | Optimize readiness probes |

### **Caching Strategies:**

1. **npm Dependencies:**
   ```yaml
   - uses: actions/setup-node@v4
     with:
       cache: 'npm'
   ```

2. **Docker Layers:**
   ```yaml
   cache-from: type=gha
   cache-to: type=gha,mode=max
   ```

3. **SonarQube Analysis:**
   ```yaml
   - Enable incremental analysis in SonarQube
   - Use PR decoration for faster feedback
   ```

---

## 📚 Additional Resources

### **Documentation:**
- **SonarQube**: https://docs.sonarqube.org/
- **Trivy**: https://aquasecurity.github.io/trivy/
- **ArgoCD**: https://argo-cd.readthedocs.io/
- **Docker Hub**: https://docs.docker.com/docker-hub/
- **GitHub Actions**: https://docs.github.com/en/actions

### **Dashboards:**
- **SonarQube**: http://192.168.11.143:30900
- **ArgoCD**: https://192.168.11.143:30443
- **Docker Hub**: https://hub.docker.com/u/cybermonta
- **GitHub Actions**: https://github.com/YOUR-USERNAME/Orchestrator/actions

### **Support:**
- GitHub Issues: For pipeline-related issues
- SonarQube Community: https://community.sonarsource.com/
- ArgoCD Slack: https://argoproj.github.io/community/join-slack

---

## ✅ Pipeline Checklist

### **Initial Setup:**
- [ ] Configure GitHub secrets
- [ ] Update ArgoCD application YAML with repository URL
- [ ] Setup self-hosted GitHub runner
- [ ] Configure SonarQube project
- [ ] Create Docker Hub access token
- [ ] Install ArgoCD on Kubernetes
- [ ] Deploy ArgoCD application

### **Pre-Deployment:**
- [ ] Code quality scan passes
- [ ] Filesystem vulnerabilities resolved
- [ ] Container image scan passes
- [ ] Quality gate passes
- [ ] All tests pass

### **Post-Deployment:**
- [ ] ArgoCD sync successful
- [ ] All pods running and healthy
- [ ] Services accessible
- [ ] No critical vulnerabilities
- [ ] Monitoring alerts configured

---

## 🎉 Success Criteria

Your pipeline is working correctly when:

1. ✅ **All phases complete** without errors
2. ✅ **Security scans** show no critical issues
3. ✅ **Quality gate** passes
4. ✅ **Images published** to Docker Hub
5. ✅ **ArgoCD syncs** successfully
6. ✅ **Pods running** and healthy
7. ✅ **Application accessible** via ingress
8. ✅ **No manual intervention** required

---

**🚀 Happy DevSecOps!**

