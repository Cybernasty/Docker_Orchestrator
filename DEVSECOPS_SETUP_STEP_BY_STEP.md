# 🔒 DevSecOps Pipeline Setup - Step by Step Guide

This guide walks you through setting up SonarQube, Trivy, and ArgoCD integration for your CI/CD pipeline **without Vault**.

---

## 📋 What You'll Set Up

- ✅ **SonarQube**: Code quality and security analysis
- ✅ **Trivy**: Vulnerability scanning (filesystem + containers)
- ✅ **ArgoCD**: GitOps-based deployment
- ✅ **Docker Hub**: Container registry
- ✅ **GitHub Actions**: Automated CI/CD pipeline

---

## 🎯 Prerequisites

Before starting, ensure you have:

- [ ] Kubernetes cluster running
- [ ] `kubectl` configured and working
- [ ] GitHub repository for your code
- [ ] Docker Hub account (username: `cybermonta`)
- [ ] SonarQube server deployed (we'll verify this)
- [ ] Self-hosted GitHub runner installed

---

## Step 1: Verify SonarQube is Running

### **1.1 Check SonarQube Access**

```bash
# Check if SonarQube is accessible
curl -f http://localhost:30900/api/system/status

# Or check the pod
kubectl get pods -n sonarqube
```

**Expected:** You should see SonarQube status as "UP"

### **1.2 Login to SonarQube**

Open your browser: `http://192.168.11.143:30900`

**Default credentials:**
- Username: `admin`
- Password: `admin` (change this on first login!)

### **1.3 Create SonarQube Token**

1. Login to SonarQube
2. Click on your profile icon (top right) → **My Account**
3. Go to **Security** tab
4. Under **Generate Tokens**:
   - Name: `github-actions`
   - Type: `Global Analysis Token`
   - Expires: Choose duration (or Never)
5. Click **Generate**
6. **Copy the token** (starts with `squ_...`)
7. **Save it securely** - you'll need it for GitHub!

### **1.4 Create SonarQube Project**

1. In SonarQube, click **Create Project** → **Manually**
2. Project display name: `Orchestrator`
3. Project key: `Orchestrator` (or `your-username_Orchestrator`)
4. Main branch name: `main`
5. Click **Set Up**
6. Choose **GitHub Actions** as analysis method
7. **Note the project key** - you'll need it!

---

## Step 2: Install and Configure ArgoCD

### **2.1 Install ArgoCD**

```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for pods to be ready (this may take 2-3 minutes)
kubectl wait --for=condition=Ready pods --all -n argocd --timeout=300s
```

### **2.2 Access ArgoCD UI**

```bash
# Change service to NodePort for easy access
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "NodePort", "ports": [{"port": 443, "targetPort": 8080, "nodePort": 30443, "name": "https"}]}}'

# Get your node IP
kubectl get nodes -o wide
```

**Access ArgoCD at:** `https://192.168.11.143:30443`

### **2.3 Get ArgoCD Password**

```bash
# Get the initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
echo
```

**Save this password!**

### **2.4 Login to ArgoCD**

1. Open `https://192.168.11.143:30443` in your browser
2. Accept the self-signed certificate warning
3. Username: `admin`
4. Password: (from step 2.3)

### **2.5 Change ArgoCD Password (Recommended)**

```bash
# Install ArgoCD CLI (optional but recommended)
curl -sSL -o argocd-linux-amd64 https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
sudo install -m 555 argocd-linux-amd64 /usr/local/bin/argocd
rm argocd-linux-amd64

# Login via CLI
argocd login 192.168.11.143:30443 --username admin --password <your-password> --insecure

# Change password
argocd account update-password
```

---

## Step 3: Update Repository Configuration

### **3.1 Update ArgoCD Application**

Edit the file `k8s/argocd-application.yaml`:

```bash
# Open the file in your editor
nano k8s/argocd-application.yaml
# or
code k8s/argocd-application.yaml
```

**Find this line:**
```yaml
repoURL: https://github.com/your-username/Orchestrator.git
```

**Replace with your actual GitHub repository:**
```yaml
repoURL: https://github.com/YOUR-ACTUAL-USERNAME/Orchestrator.git
```

**Save the file.**

### **3.2 Update SonarQube Configuration**

Edit `sonar-project.properties`:

```bash
nano sonar-project.properties
```

**Update these lines:**
```properties
sonar.projectKey=Orchestrator
sonar.organization=YOUR-USERNAME
sonar.sources=.
sonar.exclusions=**/node_modules/**,**/build/**,**/dist/**
```

**Save the file.**

---

## Step 4: Configure GitHub Secrets

### **4.1 Get Docker Hub Access Token**

1. Go to Docker Hub: https://hub.docker.com/settings/security
2. Click **New Access Token**
3. Description: `github-actions`
4. Access permissions: `Read, Write, Delete`
5. Click **Generate**
6. **Copy the token** (starts with `dckr_pat_...`)
7. **Save it securely**

### **4.2 Add Secrets to GitHub**

Go to your GitHub repository:
```
https://github.com/YOUR-USERNAME/Orchestrator/settings/secrets/actions
```

Click **New repository secret** and add each of these:

#### Secret 1: DOCKER_HUB_USERNAME
```
Name: DOCKER_HUB_USERNAME
Value: cybermonta
```

#### Secret 2: DOCKER_HUB_TOKEN
```
Name: DOCKER_HUB_TOKEN
Value: <paste-your-docker-hub-token>
```

#### Secret 3: SONAR_TOKEN
```
Name: SONAR_TOKEN
Value: <paste-your-sonarqube-token>
```

#### Secret 4: SONAR_HOST_URL
```
Name: SONAR_HOST_URL
Value: http://localhost:30900
```

#### Secret 5: ARGOCD_SERVER
```
Name: ARGOCD_SERVER
Value: 192.168.11.143:30443
```

#### Secret 6: ARGOCD_USERNAME
```
Name: ARGOCD_USERNAME
Value: admin
```

#### Secret 7: ARGOCD_PASSWORD
```
Name: ARGOCD_PASSWORD
Value: <your-argocd-password>
```

**Verification:** You should see 7 secrets listed.

---

## Step 5: Setup Self-Hosted GitHub Runner

### **5.1 Why Self-Hosted Runner?**

SonarQube and ArgoCD are running on your local network (192.168.11.143), so GitHub's cloud runners can't access them. A self-hosted runner runs on your machine and has access to your local services.

### **5.2 Install GitHub Runner**

1. Go to your repository settings:
   ```
   https://github.com/YOUR-USERNAME/Orchestrator/settings/actions/runners/new
   ```

2. Choose your operating system (Linux/Windows/Mac)

3. Follow the installation commands shown. Example for Linux:

```bash
# Create a folder
mkdir actions-runner && cd actions-runner

# Download the latest runner package
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

# Extract the installer
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Configure the runner
./config.sh --url https://github.com/YOUR-USERNAME/Orchestrator --token YOUR-RUNNER-TOKEN

# Start the runner
./run.sh
```

### **5.3 Install as a Service (Recommended)**

```bash
# Install as service (Linux)
sudo ./svc.sh install

# Start the service
sudo ./svc.sh start

# Check status
sudo ./svc.sh status
```

### **5.4 Verify Runner is Online**

Go to:
```
https://github.com/YOUR-USERNAME/Orchestrator/settings/actions/runners
```

You should see your runner with a green dot (Idle).

---

## Step 6: Deploy ArgoCD Application

### **6.1 Apply ArgoCD Application**

```bash
# Deploy the ArgoCD application
kubectl apply -f k8s/argocd-application.yaml

# Verify it was created
kubectl get application -n argocd
```

**Expected output:**
```
NAME              SYNC STATUS   HEALTH STATUS
orchestrator-app  OutOfSync     Missing
```

This is normal - ArgoCD hasn't synced yet!

### **6.2 Sync ArgoCD Application**

**Option A: Via ArgoCD UI**
1. Open ArgoCD UI: `https://192.168.11.143:30443`
2. Click on `orchestrator-app`
3. Click **SYNC** button
4. Click **SYNCHRONIZE**

**Option B: Via CLI**
```bash
argocd app sync orchestrator-app
```

### **6.3 Verify Deployment**

```bash
# Check ArgoCD application status
kubectl get application orchestrator-app -n argocd

# Check if namespace was created
kubectl get namespace orchestrator

# Check pods
kubectl get pods -n orchestrator

# Check services
kubectl get services -n orchestrator
```

---

## Step 7: Test the CI/CD Pipeline

### **7.1 Make a Test Change**

```bash
# Make a small change to trigger the pipeline
echo "# Test CI/CD Pipeline" >> README.md

# Commit and push
git add README.md
git commit -m "test: Trigger CI/CD pipeline"
git push origin main
```

### **7.2 Watch the Pipeline Execute**

Go to GitHub Actions:
```
https://github.com/YOUR-USERNAME/Orchestrator/actions
```

You should see a new workflow run: **"Integrated DevSecOps Pipeline"**

**Pipeline phases:**
1. 📊 **Code Quality** (SonarQube scan) - ~5 min
2. 🔍 **Filesystem Security** (Trivy scan) - ~3 min
3. 🐳 **Build & Scan Images** (Docker + Trivy) - ~10 min
4. 📝 **Update Manifests** (Git commit) - ~1 min
5. 🚀 **Deploy with ArgoCD** (Kubernetes deployment) - ~5 min
6. 📋 **Summary** (Final report) - ~10 sec

### **7.3 Monitor in ArgoCD**

While the pipeline runs, watch ArgoCD:
```
https://192.168.11.143:30443/applications/orchestrator-app
```

After the "Update Manifests" phase, ArgoCD will detect changes and sync automatically.

### **7.4 Verify Deployment**

```bash
# Check pods are running
kubectl get pods -n orchestrator

# Check the images deployed
kubectl get deployment frontend-orchestrator -n orchestrator -o jsonpath='{.spec.template.spec.containers[0].image}'
kubectl get statefulset backend-orchestrator -n orchestrator -o jsonpath='{.spec.template.spec.containers[0].image}'
```

---

## Step 8: Review Security Scan Results

### **8.1 View Trivy Results in GitHub**

1. Go to your repository
2. Click **Security** tab
3. Click **Code scanning alerts**
4. You'll see:
   - **Filesystem** scan results
   - **Backend image** scan results
   - **Frontend image** scan results

### **8.2 View SonarQube Results**

1. Open SonarQube: `http://192.168.11.143:30900`
2. Click on **Orchestrator** project
3. Review:
   - **Bugs**
   - **Vulnerabilities**
   - **Security Hotspots**
   - **Code Smells**
   - **Code Coverage**

### **8.3 View Docker Images**

1. Go to Docker Hub: `https://hub.docker.com/u/cybermonta`
2. You should see:
   - `cybermonta/orchestrator-backend`
   - `cybermonta/orchestrator-frontend`

---

## Step 9: Understanding the Workflow

### **9.1 When Pipeline Runs**

The pipeline triggers on:
- ✅ Push to `main` branch → Full pipeline with deployment
- ✅ Push to `develop` branch → Build and scan, no deployment
- ✅ Pull request to `main` → Analysis only

### **9.2 Pipeline Flow**

```
Push to main
    ↓
Code Quality (SonarQube)
    ↓
Filesystem Scan (Trivy)
    ↓
Build Docker Images
    ↓
Scan Images (Trivy)
    ↓
Push to Docker Hub
    ↓
Update Kubernetes Manifests
    ↓
Commit to Git
    ↓
ArgoCD Detects Change
    ↓
ArgoCD Syncs to Kubernetes
    ↓
Application Deployed! 🎉
```

### **9.3 Security Gates**

- ❌ **SonarQube Quality Gate fails** → Pipeline stops
- ❌ **Critical vulnerabilities in images** → Deployment blocked on main
- ✅ **All checks pass** → Automatic deployment

---

## Step 10: Common Operations

### **10.1 Manually Trigger Pipeline**

Go to GitHub Actions:
```
https://github.com/YOUR-USERNAME/Orchestrator/actions/workflows/integrated-devsecops.yml
```

Click **Run workflow** → Select branch → **Run workflow**

### **10.2 Manually Sync ArgoCD**

```bash
# Via CLI
argocd app sync orchestrator-app

# Force sync (ignore errors)
argocd app sync orchestrator-app --force

# Sync with prune (delete old resources)
argocd app sync orchestrator-app --prune
```

### **10.3 Check Application Logs**

```bash
# Backend logs
kubectl logs -n orchestrator -l app=backend-orchestrator -f

# Frontend logs
kubectl logs -n orchestrator -l app=frontend-orchestrator -f
```

### **10.4 Rollback Deployment**

```bash
# Via ArgoCD - rollback to previous version
argocd app history orchestrator-app
argocd app rollback orchestrator-app <revision-number>

# Via kubectl - rollback deployment
kubectl rollout undo deployment/frontend-orchestrator -n orchestrator
kubectl rollout undo statefulset/backend-orchestrator -n orchestrator
```

---

## 🐛 Troubleshooting

### **Issue 1: Pipeline fails at "Code Quality"**

**Error:** Cannot connect to SonarQube

**Solution:**
```bash
# Check SonarQube is running
kubectl get pods -n sonarqube

# Check SONAR_HOST_URL in GitHub secrets
# Should be: http://localhost:30900 (for self-hosted runner)

# Test connection from runner
curl http://localhost:30900/api/system/status
```

---

### **Issue 2: Pipeline fails at "Build Images"**

**Error:** denied: requested access to the resource is denied

**Solution:**
```bash
# Verify Docker Hub credentials
# Regenerate access token if needed
# Update DOCKER_HUB_TOKEN in GitHub secrets
```

---

### **Issue 3: ArgoCD sync fails**

**Error:** Application health check timeout

**Solution:**
```bash
# Check pod status
kubectl get pods -n orchestrator

# Check pod logs
kubectl logs -n orchestrator <pod-name>

# Check events
kubectl get events -n orchestrator --sort-by='.lastTimestamp'

# Manual sync with details
argocd app sync orchestrator-app --prune --force
```

---

### **Issue 4: Self-hosted runner offline**

**Error:** Jobs stuck in "Queued"

**Solution:**
```bash
# Check runner status
cd actions-runner
./run.sh

# Or if installed as service
sudo ./svc.sh status
sudo ./svc.sh restart
```

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] SonarQube accessible at `http://192.168.11.143:30900`
- [ ] ArgoCD accessible at `https://192.168.11.143:30443`
- [ ] GitHub runner shows as "Idle" (green dot)
- [ ] All 7 GitHub secrets configured
- [ ] ArgoCD application deployed
- [ ] Pipeline runs successfully on push
- [ ] Images pushed to Docker Hub
- [ ] Application deployed to Kubernetes
- [ ] Pods running in orchestrator namespace
- [ ] Security scan results visible in GitHub

---

## 📊 What Happens Next?

### **Every time you push to main:**

1. ⚡ **GitHub Actions** triggers automatically
2. 📊 **SonarQube** analyzes code quality
3. 🔍 **Trivy** scans for vulnerabilities
4. 🐳 **Docker** builds new images
5. 🔒 **Trivy** scans container images
6. 📤 **Docker Hub** stores secure images
7. 📝 **Git** updates with new image tags
8. 🔄 **ArgoCD** detects changes (within 3 min)
9. 🚀 **Kubernetes** deploys new version
10. ✅ **Health checks** verify deployment

**All automatic - zero manual intervention!** 🎉

---

## 🎯 Best Practices

### **1. Branch Strategy**
- `main` → Production (full pipeline + deployment)
- `develop` → Staging (build + scan only)
- `feature/*` → Development (analysis only)

### **2. Commit Messages**
```bash
feat: Add new feature
fix: Bug fix
security: Security update
chore: Maintenance
```

### **3. Before Pushing to Main**
- ✅ Test locally
- ✅ Run linting
- ✅ Check for vulnerabilities: `npm audit`
- ✅ Review code quality in SonarQube

---

## 📚 Useful Links

- **GitHub Actions**: `https://github.com/YOUR-USERNAME/Orchestrator/actions`
- **ArgoCD UI**: `https://192.168.11.143:30443`
- **SonarQube**: `http://192.168.11.143:30900`
- **Docker Hub**: `https://hub.docker.com/u/cybermonta`
- **Detailed Guide**: `INTEGRATED_CICD_GUIDE.md`

---

## 🎉 You're Done!

Your DevSecOps pipeline is now fully configured with:
- ✅ SonarQube for code quality
- ✅ Trivy for security scanning
- ✅ ArgoCD for GitOps deployment
- ✅ Automated CI/CD with GitHub Actions

**Push your code and watch the magic happen!** 🚀

