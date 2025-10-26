# ArgoCD Configuration for Orchestrator Application

## 📋 Current ArgoCD Application Configuration

Your ArgoCD application is defined in: `k8s/argocd-application.yaml`

### **Key Configuration:**

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: orchestrator-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/your-username/Orchestrator.git
    targetRevision: HEAD
    path: k8s
    directory:
      include: "*.yaml"
      exclude: "argocd-*.yaml"
  destination:
    server: https://kubernetes.default.svc
    namespace: orchestrator
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
      - PruneLast=true
```

---

## 🎯 What This Configuration Does

### **1. Application Definition**
- **Name**: `orchestrator-app`
- **Namespace**: `argocd` (where the ArgoCD Application resource lives)
- **Project**: `default` (ArgoCD project)

### **2. Source (Git Repository)**
- **Repository**: `https://github.com/your-username/Orchestrator.git`
- **Branch**: `HEAD` (tracks the default branch, usually `main`)
- **Path**: `k8s` (directory containing Kubernetes manifests)
- **Includes**: All `*.yaml` files
- **Excludes**: `argocd-*.yaml` (prevents recursive deployment)

### **3. Destination (Kubernetes Cluster)**
- **Cluster**: `https://kubernetes.default.svc` (the same cluster where ArgoCD is running)
- **Namespace**: `orchestrator` (target namespace for your application)

### **4. Sync Policy (Automation)**
- **Automated Sync**: ✅ Enabled
  - **Prune**: ✅ Delete resources removed from Git
  - **Self-Heal**: ✅ Revert manual changes to match Git
- **Create Namespace**: ✅ Auto-create `orchestrator` namespace if missing
- **Retry Logic**: 5 attempts with exponential backoff (5s → 10s → 20s → 40s → 3m max)

### **5. Ignore Differences**
ArgoCD won't trigger sync for changes to:
- Deployment replicas (allows manual scaling)
- StatefulSet replicas (allows manual scaling)

---

## 🚀 Setup Steps

### **Step 1: Install ArgoCD**

```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for pods to be ready
kubectl wait --for=condition=Ready pods --all -n argocd --timeout=300s

# Get admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
echo
```

### **Step 2: Access ArgoCD UI**

```bash
# Option A: Port Forward
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Access: https://localhost:8080

# Option B: NodePort (Recommended for your setup)
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "NodePort", "ports": [{"port": 443, "targetPort": 8080, "nodePort": 30443, "name": "https"}]}}'
# Access: https://192.168.11.143:30443
```

**Login:**
- **Username**: `admin`
- **Password**: [from Step 1 command]

### **Step 3: Update Git Repository URL**

**IMPORTANT**: You need to update the repository URL in `argocd-application.yaml`:

```yaml
source:
  repoURL: https://github.com/YOUR-ACTUAL-USERNAME/Orchestrator.git
```

Replace `your-username` with your actual GitHub username or organization.

### **Step 4: Deploy the ArgoCD Application**

```bash
# Apply the ArgoCD application
kubectl apply -f k8s/argocd-application.yaml

# Verify application was created
kubectl get applications -n argocd

# Check application status
kubectl get application orchestrator-app -n argocd -o yaml
```

### **Step 5: Verify Deployment**

```bash
# Check application sync status
kubectl get application orchestrator-app -n argocd

# Check pods in orchestrator namespace
kubectl get pods -n orchestrator

# View in ArgoCD UI
# Go to: https://localhost:8080/applications/orchestrator-app
```

---

## 🔄 How ArgoCD Works with Your Setup

### **Automated GitOps Flow:**

1. **You push changes** to your Git repository (`k8s/*.yaml` files)
2. **ArgoCD detects** the changes (polls every 3 minutes by default)
3. **ArgoCD syncs** the changes to your Kubernetes cluster
4. **Self-healing**: If someone manually changes resources, ArgoCD reverts them
5. **Pruning**: If you delete a YAML file from Git, ArgoCD deletes the resource from the cluster

### **What Gets Deployed:**

All files in `k8s/` directory:
- ✅ `backend-deployment.yaml`
- ✅ `frontend-deployment.yaml`
- ✅ `services.yaml`
- ✅ `configmap.yaml`
- ✅ `secret.yaml`
- ✅ `ingress.yaml`
- ✅ `hpa.yaml`
- ✅ `network-policy.yaml`
- ✅ `monitoring` resources
- ❌ `argocd-*.yaml` (excluded to prevent recursion)

---

## 🎨 ArgoCD UI Features

### **Application View:**
- **Sync Status**: OutOfSync / Synced / Unknown
- **Health Status**: Healthy / Progressing / Degraded / Suspended
- **Resource Tree**: Visual representation of all resources
- **Live Manifest**: Compare Git vs Cluster state

### **Manual Operations:**
- **Sync**: Manually trigger deployment
- **Refresh**: Check for Git changes
- **Hard Refresh**: Force re-check
- **Rollback**: Revert to previous version
- **Delete**: Remove application

---

## 🔧 Common ArgoCD Operations

### **Sync Application (Manual)**
```bash
# Via CLI
argocd app sync orchestrator-app

# Via kubectl
kubectl patch application orchestrator-app -n argocd -p '{"operation":{"initiatedBy":{"username":"admin"},"sync":{"revision":"HEAD"}}}' --type merge
```

### **View Application Status**
```bash
# Via CLI
argocd app get orchestrator-app

# Via kubectl
kubectl get application orchestrator-app -n argocd -o yaml
```

### **View Sync History**
```bash
argocd app history orchestrator-app
```

### **Rollback to Previous Version**
```bash
argocd app rollback orchestrator-app <revision-number>
```

### **Disable Auto-Sync Temporarily**
```bash
kubectl patch application orchestrator-app -n argocd --type json -p='[{"op": "remove", "path": "/spec/syncPolicy/automated"}]'
```

### **Re-enable Auto-Sync**
```bash
kubectl patch application orchestrator-app -n argocd --type merge -p '{"spec":{"syncPolicy":{"automated":{"prune":true,"selfHeal":true}}}}'
```

---

## 🔐 Git Repository Setup

### **Public Repository:**
No additional configuration needed if your repository is public.

### **Private Repository:**
```bash
# Add repository credentials via ArgoCD UI:
# Settings → Repositories → Connect Repo

# Or via CLI:
argocd repo add https://github.com/your-username/Orchestrator.git \
  --username your-github-username \
  --password your-github-token
```

### **Using SSH:**
```bash
# Generate SSH key
ssh-keygen -t rsa -b 4096 -C "argocd@orchestrator"

# Add public key to GitHub: Settings → Deploy Keys

# Add repository via ArgoCD UI or CLI:
argocd repo add git@github.com:your-username/Orchestrator.git \
  --ssh-private-key-path ~/.ssh/id_rsa
```

---

## 📊 Monitoring ArgoCD

### **Check Application Health**
```bash
# Get application status
kubectl get application -n argocd orchestrator-app -o jsonpath='{.status.sync.status}'
# Output: Synced

kubectl get application -n argocd orchestrator-app -o jsonpath='{.status.health.status}'
# Output: Healthy
```

### **View ArgoCD Logs**
```bash
# ArgoCD server logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-server -f

# Application controller logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-application-controller -f
```

---

## 🐛 Troubleshooting

### **Issue 1: Application OutOfSync**

**Check what's different:**
```bash
argocd app diff orchestrator-app

# Or via UI: Click "App Diff" button
```

**Manually sync:**
```bash
argocd app sync orchestrator-app
```

### **Issue 2: Application Unhealthy**

**Check resource status:**
```bash
# Via CLI
argocd app get orchestrator-app

# Check pods
kubectl get pods -n orchestrator
kubectl describe pod <pod-name> -n orchestrator
```

### **Issue 3: Git Repository Connection Failed**

**Verify repository:**
```bash
# List repositories
argocd repo list

# Test connection
argocd repo get https://github.com/your-username/Orchestrator.git
```

### **Issue 4: Sync Failed**

**Check ArgoCD logs:**
```bash
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-application-controller --tail=100
```

**Check sync operation:**
```bash
argocd app get orchestrator-app --show-operation
```

---

## ⚙️ Advanced Configuration Options

### **Change Sync Frequency**
```yaml
# In argocd-application.yaml, add:
spec:
  source:
    # ... existing config ...
  syncPolicy:
    syncOptions:
      - SyncFrequency=1m  # Check every 1 minute (default is 3m)
```

### **Add Sync Hooks**
```yaml
# Pre-sync hook (runs before deployment)
metadata:
  annotations:
    argocd.argoproj.io/hook: PreSync
    argocd.argoproj.io/hook-delete-policy: BeforeHookCreation
```

### **Enable Notifications**
```bash
# Install ArgoCD Notifications
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj-labs/argocd-notifications/stable/manifests/install.yaml

# Configure Slack/Email notifications
kubectl create secret generic argocd-notifications-secret -n argocd \
  --from-literal=slack-token=$SLACK_TOKEN
```

---

## 📝 Quick Reference

```bash
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Get password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Access UI
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Deploy application
kubectl apply -f k8s/argocd-application.yaml

# Check status
kubectl get application -n argocd
argocd app get orchestrator-app

# Sync application
argocd app sync orchestrator-app

# View logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-server
```

---

## 🎯 Next Steps for Your Setup

1. ✅ **Update Git Repository URL** in `argocd-application.yaml`
2. ✅ **Install ArgoCD** if not already installed
3. ✅ **Configure repository access** (if private)
4. ✅ **Apply ArgoCD application**: `kubectl apply -f k8s/argocd-application.yaml`
5. ✅ **Access ArgoCD UI** to monitor deployments
6. ✅ **Push changes to Git** and watch ArgoCD auto-deploy
7. ✅ **Set up notifications** for deployment status

---

## 📚 Documentation Links

- **ArgoCD Official Docs**: https://argo-cd.readthedocs.io/
- **Getting Started**: https://argo-cd.readthedocs.io/en/stable/getting_started/
- **Application YAML**: https://argo-cd.readthedocs.io/en/stable/operator-manual/declarative-setup/
- **Sync Options**: https://argo-cd.readthedocs.io/en/stable/user-guide/sync-options/
- **Best Practices**: https://argo-cd.readthedocs.io/en/stable/user-guide/best_practices/



