# ArgoCD Setup Guide for Orchestrator

## 🎯 Quick Setup

This guide will help you set up ArgoCD for GitOps deployment of your orchestrator application.

---

## 📋 Prerequisites

- ✅ Kubernetes cluster running
- ✅ kubectl configured
- ✅ Git repository accessible
- ✅ Helm (optional, for advanced features)

---

## 🚀 Installation Steps

### **Step 1: Install ArgoCD**

```bash
# Create ArgoCD namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for all pods to be ready
kubectl wait --for=condition=Ready pods --all -n argocd --timeout=300s
```

### **Step 2: Access ArgoCD UI**

#### **Option A: Port Forward (Temporary Access)**

```bash
# Port forward to access UI
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Open browser: https://localhost:8080
```

#### **Option B: NodePort (Permanent Access - Recommended)**

```bash
# Change service type to NodePort
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "NodePort", "ports": [{"port": 443, "targetPort": 8080, "nodePort": 30443, "name": "https"}]}}'

# Get node IP
kubectl get nodes -o wide

# Access ArgoCD at: https://<node-ip>:30443
# Example: https://192.168.11.143:30443
```

#### **Option C: LoadBalancer (Cloud Kubernetes)**

```bash
# Change service type to LoadBalancer
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'

# Get external IP
kubectl get svc argocd-server -n argocd
```

### **Step 3: Get Initial Admin Password**

```bash
# Get the initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
echo

# Save this password!
```

### **Step 4: Login to ArgoCD**

#### **Via UI:**
1. Open ArgoCD UI (https://localhost:8080 or https://192.168.11.143:30443)
2. Username: `admin`
3. Password: [from Step 3]
4. Accept self-signed certificate warning

#### **Via CLI:**

```bash
# Install ArgoCD CLI (if not installed)
# Linux/WSL
curl -sSL -o argocd-linux-amd64 https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
sudo install -m 555 argocd-linux-amd64 /usr/local/bin/argocd
rm argocd-linux-amd64

# Mac
brew install argocd

# Windows
# Download from: https://github.com/argoproj/argo-cd/releases/latest

# Login
argocd login 192.168.11.143:30443 --username admin --password <password> --insecure

# Change password (recommended)
argocd account update-password
```

---

## 🔧 Configure ArgoCD for Your Repository

### **Step 1: Update ArgoCD Application YAML**

Edit `k8s/argocd-application.yaml` and update the repository URL:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: orchestrator-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/YOUR-USERNAME/Orchestrator.git  # ← UPDATE THIS
    targetRevision: HEAD
    path: k8s
  destination:
    server: https://kubernetes.default.svc
    namespace: orchestrator
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

**Replace `YOUR-USERNAME` with your actual GitHub username or organization.**

### **Step 2: Add Repository to ArgoCD (if Private)**

If your repository is private, add credentials:

#### **Via UI:**
1. Go to **Settings** → **Repositories**
2. Click **Connect Repo**
3. Choose connection method:
   - **HTTPS**: Enter URL, username, and password/token
   - **SSH**: Upload SSH private key

#### **Via CLI (HTTPS):**

```bash
argocd repo add https://github.com/YOUR-USERNAME/Orchestrator.git \
  --username YOUR-GITHUB-USERNAME \
  --password YOUR-GITHUB-TOKEN
```

#### **Via CLI (SSH):**

```bash
# Generate SSH key
ssh-keygen -t rsa -b 4096 -C "argocd@orchestrator" -f ~/.ssh/argocd_rsa

# Add public key to GitHub
# GitHub → Settings → Deploy Keys → Add deploy key
cat ~/.ssh/argocd_rsa.pub

# Add repository to ArgoCD
argocd repo add git@github.com:YOUR-USERNAME/Orchestrator.git \
  --ssh-private-key-path ~/.ssh/argocd_rsa
```

### **Step 3: Deploy ArgoCD Application**

```bash
# Apply the ArgoCD application manifest
kubectl apply -f k8s/argocd-application.yaml

# Verify application was created
kubectl get application -n argocd

# Check application status
argocd app get orchestrator-app
```

---

## 🔍 Verify Deployment

### **Check Application Status:**

```bash
# Via CLI
argocd app get orchestrator-app

# Via kubectl
kubectl get application orchestrator-app -n argocd -o yaml

# Check sync status
argocd app sync orchestrator-app
```

### **Check Deployed Resources:**

```bash
# Check pods
kubectl get pods -n orchestrator

# Check services
kubectl get services -n orchestrator

# Check deployments
kubectl get deployments -n orchestrator

# Check statefulsets
kubectl get statefulsets -n orchestrator
```

---

## 🎨 ArgoCD UI Features

### **Application Dashboard:**
- **Sync Status**: Shows if Git and cluster are in sync
- **Health Status**: Shows if resources are healthy
- **Resource Tree**: Visual representation of all resources
- **Live Manifest**: Compare Git state vs cluster state

### **Manual Operations:**

#### **Sync Application:**
```bash
# Full sync
argocd app sync orchestrator-app

# Sync with prune
argocd app sync orchestrator-app --prune

# Sync specific resource
argocd app sync orchestrator-app --resource StatefulSet:backend-orchestrator
```

#### **Refresh Application:**
```bash
# Soft refresh (check Git for changes)
argocd app refresh orchestrator-app

# Hard refresh (force re-check)
argocd app refresh orchestrator-app --hard
```

#### **View Sync History:**
```bash
argocd app history orchestrator-app
```

#### **Rollback to Previous Version:**
```bash
# List history first to get revision number
argocd app history orchestrator-app

# Rollback to specific revision
argocd app rollback orchestrator-app 5
```

#### **Delete Application:**
```bash
# Delete application (keeps deployed resources)
argocd app delete orchestrator-app

# Delete application and all deployed resources
argocd app delete orchestrator-app --cascade
```

---

## 🔄 GitOps Workflow

### **How It Works:**

1. **You push changes** to your Git repository
   ```bash
   git add k8s/backend-deployment.yaml
   git commit -m "Update backend image to v2.0"
   git push
   ```

2. **ArgoCD detects changes** (polls every 3 minutes by default)
   - Or manually refresh: `argocd app refresh orchestrator-app`

3. **ArgoCD compares** Git state vs Kubernetes state
   - Shows differences in UI

4. **ArgoCD syncs** automatically (if auto-sync enabled)
   - Or manually: `argocd app sync orchestrator-app`

5. **Kubernetes updates** resources
   - Rolling updates for deployments
   - Ordered updates for statefulsets

6. **Self-healing** reverts manual changes
   - If someone manually edits a resource, ArgoCD reverts it

---

## ⚙️ Advanced Configuration

### **Change Sync Frequency:**

```bash
# Edit ArgoCD ConfigMap
kubectl edit configmap argocd-cm -n argocd

# Add this under data:
data:
  timeout.reconciliation: 60s  # Check every 60 seconds (default: 180s)
```

### **Enable Webhook for Instant Sync:**

Instead of polling, configure GitHub to notify ArgoCD of changes:

1. **Get ArgoCD Webhook URL:**
   ```
   https://192.168.11.143:30443/api/webhook
   ```

2. **Add Webhook in GitHub:**
   - Go to repository → Settings → Webhooks → Add webhook
   - Payload URL: `https://192.168.11.143:30443/api/webhook`
   - Content type: `application/json`
   - Secret: (optional, can be configured in ArgoCD)
   - Events: Just the `push` event

3. **Now changes sync instantly!**

### **Enable Notifications:**

Install ArgoCD Notifications for Slack/Email alerts:

```bash
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj-labs/argocd-notifications/stable/manifests/install.yaml
```

Configure Slack notifications:

```bash
kubectl create secret generic argocd-notifications-secret -n argocd \
  --from-literal=slack-token=$SLACK_TOKEN

kubectl edit configmap argocd-notifications-cm -n argocd
# Add Slack configuration
```

---

## 🐛 Troubleshooting

### **Issue 1: Application OutOfSync**

**Check what's different:**
```bash
argocd app diff orchestrator-app
```

**Manually sync:**
```bash
argocd app sync orchestrator-app --force
```

### **Issue 2: Application Unhealthy**

**Check logs:**
```bash
# ArgoCD application controller logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-application-controller -f

# Check specific pod
kubectl describe pod -n orchestrator <pod-name>
kubectl logs -n orchestrator <pod-name>
```

### **Issue 3: Git Repository Connection Failed**

**Test connection:**
```bash
argocd repo list
argocd repo get https://github.com/YOUR-USERNAME/Orchestrator.git
```

**Re-add repository:**
```bash
argocd repo add https://github.com/YOUR-USERNAME/Orchestrator.git \
  --username YOUR-USERNAME \
  --password YOUR-TOKEN
```

### **Issue 4: Sync Timeout**

**Increase timeout:**
```bash
argocd app sync orchestrator-app --timeout 600
```

### **Issue 5: Self-Signed Certificate Issues**

**Add insecure flag:**
```bash
argocd login 192.168.11.143:30443 --insecure
```

---

## 📊 Monitoring ArgoCD

### **Check ArgoCD Health:**

```bash
# Check all ArgoCD pods
kubectl get pods -n argocd

# Check ArgoCD server
kubectl get svc -n argocd

# View ArgoCD metrics
kubectl port-forward -n argocd svc/argocd-metrics 8082:8082
# Access: http://localhost:8082/metrics
```

### **View ArgoCD Logs:**

```bash
# Server logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-server -f

# Application controller logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-application-controller -f

# Repo server logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-repo-server -f
```

---

## 🔐 Security Best Practices

### **1. Change Default Admin Password**
```bash
argocd account update-password
```

### **2. Create Additional Users**
```bash
# Edit ConfigMap
kubectl edit configmap argocd-cm -n argocd

# Add users under data:
data:
  accounts.developer: apiKey, login
  accounts.viewer: login

# Set passwords
argocd account update-password --account developer
argocd account update-password --account viewer
```

### **3. Configure RBAC**
```bash
# Edit RBAC ConfigMap
kubectl edit configmap argocd-rbac-cm -n argocd

# Add policies:
data:
  policy.csv: |
    p, role:developer, applications, *, */*, allow
    p, role:viewer, applications, get, */*, allow
    g, developer, role:developer
    g, viewer, role:viewer
```

### **4. Enable TLS**
```bash
# Use cert-manager to issue certificates
# Or use Let's Encrypt for public domains
```

### **5. Restrict Repository Access**
```bash
# Use deploy keys (read-only) instead of user tokens
# Configure minimal permissions
```

---

## 📚 Quick Reference

### **Common Commands:**

```bash
# Login
argocd login <server> --username admin --password <password> --insecure

# List applications
argocd app list

# Get application details
argocd app get orchestrator-app

# Sync application
argocd app sync orchestrator-app

# View diff
argocd app diff orchestrator-app

# View logs
argocd app logs orchestrator-app

# Rollback
argocd app rollback orchestrator-app <revision>

# Delete
argocd app delete orchestrator-app
```

### **kubectl Commands:**

```bash
# Get applications
kubectl get applications -n argocd

# Describe application
kubectl describe application orchestrator-app -n argocd

# Get application YAML
kubectl get application orchestrator-app -n argocd -o yaml

# Delete application
kubectl delete application orchestrator-app -n argocd
```

---

## 🎯 Integration with CI/CD

Your CI/CD pipeline will:

1. **Build Docker images** with unique tags
2. **Update Kubernetes manifests** with new image tags
3. **Commit changes** to Git repository
4. **ArgoCD detects** changes and syncs automatically

Or manually trigger sync:

```bash
argocd app sync orchestrator-app --prune --force
```

---

## ✅ Setup Checklist

- [ ] ArgoCD installed on Kubernetes
- [ ] ArgoCD UI accessible
- [ ] Admin password changed
- [ ] Repository URL updated in `argocd-application.yaml`
- [ ] Repository credentials configured (if private)
- [ ] ArgoCD application deployed
- [ ] Application synced successfully
- [ ] All pods running in orchestrator namespace
- [ ] Webhook configured for instant sync (optional)
- [ ] Notifications configured (optional)

---

## 🚀 Next Steps

1. **Configure GitHub secrets** for CI/CD pipeline
2. **Push changes** to your repository
3. **Watch ArgoCD** automatically deploy changes
4. **Monitor** application health in ArgoCD UI
5. **Enjoy GitOps!** 🎉

---

**📖 More Resources:**
- Official Docs: https://argo-cd.readthedocs.io/
- Getting Started: https://argo-cd.readthedocs.io/en/stable/getting_started/
- Best Practices: https://argo-cd.readthedocs.io/en/stable/user-guide/best_practices/


