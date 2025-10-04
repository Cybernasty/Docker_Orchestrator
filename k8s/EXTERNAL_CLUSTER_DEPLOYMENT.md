# External Kubernetes Cluster Deployment Guide

This guide explains how to deploy the Orchestrator application to an external Kubernetes cluster (not Docker Desktop's built-in Kubernetes).

## 🎯 **Overview**

Your existing Kubernetes files can be used with external clusters, but several modifications are required:

1. **Image Registry**: Update from `localhost:6500` to your external registry
2. **Docker Host Configuration**: Adjust for external cluster Docker setup
3. **Network Configuration**: Update CORS and domain settings
4. **Storage**: Ensure proper storage classes are available

## 📋 **Prerequisites**

### **1. External Kubernetes Cluster**
- A running Kubernetes cluster (AWS EKS, GKE, Azure AKS, or on-premises)
- `kubectl` configured to access your cluster
- Proper RBAC permissions

### **2. Container Registry**
- Access to a container registry (Docker Hub, AWS ECR, GCR, Azure Container Registry, etc.)
- Registry credentials configured

### **3. Docker Daemon Access**
Your external cluster needs one of these approaches:

#### **Option A: Docker-in-Docker (DinD)**
```yaml
# Add this to your backend deployment
- name: dind
  image: docker:dind
  securityContext:
    privileged: true
  volumeMounts:
  - name: dind-storage
    mountPath: /var/lib/docker
```

#### **Option B: Remote Docker Daemon**
- Configure a remote Docker daemon accessible from your cluster
- Update `DOCKER_HOST` in ConfigMap

#### **Option C: Containerd Direct Access**
- Modify backend to use containerd directly instead of Docker
- Requires code changes in the backend

## 🔧 **Required Modifications**

### **1. Update Image References**

Replace `localhost:6500` with your external registry:

```yaml
# Before
image: localhost:6500/orchestrator-backend:latest

# After
image: your-registry.com/orchestrator-backend:latest
```

### **2. Update ConfigMap**

Key changes in `external-cluster-configmap.yaml`:

```yaml
data:
  # Update CORS origin for your domain
  CORS_ORIGIN: "https://your-domain.com"
  
  # Docker host configuration
  DOCKER_HOST: "unix:///var/run/docker.sock"  # For most external clusters
  # OR
  DOCKER_HOST: "tcp://your-docker-host:2375"  # For remote Docker daemon
```

### **3. Update Secrets**

Ensure your `secrets.yaml` contains proper values:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: orchestrator-secrets
  namespace: orchestrator
type: Opaque
data:
  JWT_SECRET: <base64-encoded-jwt-secret>
  SSL_PASSPHRASE: <base64-encoded-ssl-passphrase>
```

## 🚀 **Deployment Steps**

### **1. Build and Push Images**

```powershell
# Build images
docker build -t your-registry.com/orchestrator-backend:latest ../backend_orchestrator
docker build -t your-registry.com/orchestrator-frontend:latest ../frontend_orchestrator

# Push to registry
docker push your-registry.com/orchestrator-backend:latest
docker push your-registry.com/orchestrator-frontend:latest
```

### **2. Deploy to External Cluster**

```powershell
# Use the provided script
.\deploy-external-cluster.ps1 -Registry "your-registry.com"

# Or deploy manually
kubectl apply -f namespace.yaml
kubectl apply -f secrets.yaml -n orchestrator
kubectl apply -f external-cluster-configmap.yaml -n orchestrator
kubectl apply -f external-cluster-deployment.yaml -n orchestrator
kubectl apply -f external-cluster-frontend.yaml -n orchestrator
```

### **3. Configure Ingress (Optional)**

Update `ingress.yaml` with your domain:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: orchestrator-ingress
  namespace: orchestrator
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - your-domain.com
    secretName: orchestrator-tls
  rules:
  - host: your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-orchestrator
            port:
              number: 80
```

## 🔍 **Verification**

### **1. Check Pod Status**
```bash
kubectl get pods -n orchestrator
```

### **2. Check Services**
```bash
kubectl get services -n orchestrator
```

### **3. Check Logs**
```bash
kubectl logs -f deployment/frontend-orchestrator -n orchestrator
kubectl logs -f statefulset/backend-orchestrator -n orchestrator
```

## ⚠️ **Common Issues and Solutions**

### **1. Image Pull Errors**
- **Issue**: `ErrImagePull` or `ImagePullBackOff`
- **Solution**: Ensure registry credentials are configured
```bash
kubectl create secret docker-registry regcred \
  --docker-server=your-registry.com \
  --docker-username=your-username \
  --docker-password=your-password \
  --docker-email=your-email \
  -n orchestrator
```

### **2. Docker Socket Access**
- **Issue**: Backend can't access Docker daemon
- **Solution**: Use Docker-in-Docker or configure remote Docker daemon

### **3. CORS Issues**
- **Issue**: Frontend can't connect to backend
- **Solution**: Update `CORS_ORIGIN` in ConfigMap to match your domain

### **4. Storage Issues**
- **Issue**: PVC binding failures
- **Solution**: Ensure storage class exists and is accessible
```bash
kubectl get storageclass
```

## 🔧 **Advanced Configuration**

### **1. High Availability**
- Use multiple replicas
- Configure pod anti-affinity
- Use persistent storage for stateful components

### **2. Security**
- Enable RBAC
- Use network policies
- Configure TLS/SSL
- Implement proper secrets management

### **3. Monitoring**
- Deploy Prometheus and Grafana
- Configure alerting
- Set up log aggregation

## 📞 **Support**

If you encounter issues:

1. Check pod logs: `kubectl logs <pod-name> -n orchestrator`
2. Check events: `kubectl get events -n orchestrator`
3. Verify configuration: `kubectl describe <resource> -n orchestrator`
4. Test connectivity: `kubectl exec -it <pod-name> -n orchestrator -- curl <service-url>`

## 🔄 **Migration from Docker Desktop**

To migrate from Docker Desktop Kubernetes to external cluster:

1. **Backup current configuration**
2. **Update image references**
3. **Modify ConfigMap for external cluster**
4. **Deploy to external cluster**
5. **Update DNS/ingress configuration**
6. **Test functionality**
7. **Remove Docker Desktop deployment** 