# ArgoCD Ports and Access Guide

## 🔌 ArgoCD Default Ports

### **ArgoCD Server (UI & API)**
- **Port 8080**: HTTP (internal service port)
- **Port 8083**: Metrics endpoint
- **Port 443**: HTTPS (if configured with TLS)

### **ArgoCD Service Ports**
When deployed, ArgoCD server service typically exposes:
- **Port 80**: HTTP (mapped to container port 8080)
- **Port 443**: HTTPS (mapped to container port 8080 with TLS)

---

## 📍 Check Current ArgoCD Deployment

```bash
# Check if ArgoCD is installed
kubectl get namespace argocd

# Check ArgoCD pods
kubectl get pods -n argocd

# Check ArgoCD services and their ports
kubectl get svc -n argocd

# Specifically check argocd-server service
kubectl get svc argocd-server -n argocd
```

---

## 🚀 Access Methods

### **Method 1: Port Forward (Recommended for Testing)**

```bash
# Port forward to ArgoCD server
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Access ArgoCD UI at:
# https://localhost:8080
# (ignore SSL warning in browser)
```

### **Method 2: NodePort (For Local Cluster)**

```bash
# Change service to NodePort
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "NodePort"}}'

# Get the NodePort
kubectl get svc argocd-server -n argocd

# Access via:
# https://<node-ip>:<nodeport>
```

**Recommended NodePort**: 30443 or 30080

### **Method 3: LoadBalancer (For Cloud)**

```bash
# Change service to LoadBalancer
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'

# Get external IP
kubectl get svc argocd-server -n argocd

# Access via external IP
```

### **Method 4: Ingress (Production)**

See section below for Ingress configuration.

---

## 🔐 Get ArgoCD Admin Password

```bash
# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
echo

# Username: admin
# Password: [from above command]
```

---

## 📦 Install ArgoCD (If Not Installed)

```bash
# Create argocd namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for pods to be ready
kubectl wait --for=condition=Ready pods --all -n argocd --timeout=300s

# Get admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
echo
```

---

## 🌐 Expose ArgoCD with NodePort

### Create NodePort Service

```yaml
# argocd-server-nodeport.yaml
apiVersion: v1
kind: Service
metadata:
  name: argocd-server-nodeport
  namespace: argocd
spec:
  type: NodePort
  selector:
    app.kubernetes.io/name: argocd-server
  ports:
  - name: http
    port: 80
    targetPort: 8080
    nodePort: 30080
    protocol: TCP
  - name: https
    port: 443
    targetPort: 8080
    nodePort: 30443
    protocol: TCP
```

Apply it:
```bash
kubectl apply -f argocd-server-nodeport.yaml

# Access at:
# HTTP:  http://<node-ip>:30080
# HTTPS: https://<node-ip>:30443
```

---

## 🔧 Expose ArgoCD with Ingress

### Create Ingress Resource

```yaml
# argocd-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: argocd-server-ingress
  namespace: argocd
  annotations:
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/ssl-passthrough: "true"
    nginx.ingress.kubernetes.io/backend-protocol: "HTTPS"
spec:
  ingressClassName: nginx
  rules:
  - host: argocd.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: argocd-server
            port:
              number: 443
  tls:
  - hosts:
    - argocd.example.com
    secretName: argocd-server-tls
```

Apply it:
```bash
kubectl apply -f argocd-ingress.yaml

# Access at: https://argocd.example.com
```

---

## 🎯 Recommended Ports Summary

| Access Method | Port | Protocol | Use Case |
|---------------|------|----------|----------|
| **Port Forward** | 8080 (local) → 443 (pod) | HTTPS | Development/Testing |
| **NodePort HTTP** | 30080 | HTTP | Local cluster access |
| **NodePort HTTPS** | 30443 | HTTPS | Local cluster access (secure) |
| **LoadBalancer** | 80/443 | HTTP/HTTPS | Cloud environments |
| **Ingress** | 80/443 | HTTP/HTTPS | Production with domain |

---

## ✅ Verify ArgoCD Access

### 1. Check Service
```bash
kubectl get svc argocd-server -n argocd

# Expected output:
# NAME            TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)
# argocd-server   ClusterIP   10.x.x.x        <none>        80/TCP,443/TCP
```

### 2. Port Forward and Test
```bash
# Port forward
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Open browser: https://localhost:8080
# Login with admin/<password-from-secret>
```

### 3. Check ArgoCD CLI Access
```bash
# Install argocd CLI (if not installed)
# Linux/Mac:
curl -sSL -o /usr/local/bin/argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
chmod +x /usr/local/bin/argocd

# Windows (PowerShell):
# Download from: https://github.com/argoproj/argo-cd/releases/latest

# Login via CLI
argocd login localhost:8080 --insecure
# Username: admin
# Password: [from secret]
```

---

## 🔒 Security Considerations

### Disable HTTP (Force HTTPS Only)
```bash
# Update argocd-server deployment
kubectl patch deployment argocd-server -n argocd -p '
{
  "spec": {
    "template": {
      "spec": {
        "containers": [{
          "name": "argocd-server",
          "command": [
            "argocd-server",
            "--insecure=false"
          ]
        }]
      }
    }
  }
}'
```

### Change Admin Password
```bash
# After first login, change password via UI:
# User Info → Update Password

# Or via CLI:
argocd account update-password
```

---

## 🐛 Troubleshooting

### Issue 1: Can't access ArgoCD UI

**Solution**:
```bash
# Check if pods are running
kubectl get pods -n argocd

# Check service
kubectl get svc argocd-server -n argocd

# Check logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-server

# Try port forward
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

### Issue 2: "Unable to login"

**Solution**:
```bash
# Get fresh password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# If secret doesn't exist, reset admin password
kubectl -n argocd patch secret argocd-secret \
  -p '{"stringData": {"admin.password": "$2a$10$rRyBsGSHK6.uc8fntPwVIuLVHgsAhAX7TcdrqW/RADU0uh7CaChLa"}}'
# Password is now: admin
```

### Issue 3: SSL/TLS certificate errors

**Solution**:
```bash
# Use port-forward with --insecure flag
kubectl port-forward svc/argocd-server -n argocd 8080:80

# Access via HTTP: http://localhost:8080

# Or accept self-signed cert in browser
```

---

## 📝 Quick Reference Commands

```bash
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Get password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Port forward (HTTPS)
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Port forward (HTTP - insecure mode)
kubectl port-forward svc/argocd-server -n argocd 8080:80

# Check services
kubectl get svc -n argocd

# Deploy your application
kubectl apply -f k8s/argocd-application.yaml
```

---

## 🎯 Recommended Setup for Your Cluster

Based on your setup (on-premise Kubernetes), I recommend:

### **Option 1: NodePort (Simple)**
```bash
# Expose ArgoCD on NodePort 30443
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "NodePort", "ports": [{"port": 443, "targetPort": 8080, "nodePort": 30443, "name": "https"}]}}'

# Access at: https://192.168.11.143:30443
```

### **Option 2: Port Forward (Development)**
```bash
# Port forward to local machine
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Access at: https://localhost:8080
```

### **Option 3: Ingress (Production)**
Use the Ingress configuration above if you have nginx-ingress-controller installed.

---

## 🚀 Next Steps

1. ✅ Install ArgoCD (if not already installed)
2. ✅ Get admin password
3. ✅ Choose access method (NodePort recommended)
4. ✅ Access ArgoCD UI
5. ✅ Deploy your application using `argocd-application.yaml`
6. ✅ Configure Git repository in ArgoCD



