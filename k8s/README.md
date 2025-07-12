# Orchestrator Kubernetes Deployment Guide

This guide provides complete instructions for deploying the Orchestrator application to Kubernetes with high availability.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Production Setup](#production-setup)
4. [Deployment](#deployment)
5. [Monitoring & Observability](#monitoring--observability)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools

- **kubectl** - Kubernetes command-line tool
- **Docker** - Container runtime
- **Helm** (optional) - Package manager for Kubernetes
- **k9s** (optional) - Terminal-based UI for Kubernetes

### Install kubectl

**Windows:**
```powershell
# Using Chocolatey
choco install kubernetes-cli

# Using winget
winget install -e --id Kubernetes.kubectl

# Manual installation
# Download from: https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/
```

**macOS:**
```bash
# Using Homebrew
brew install kubectl

# Using MacPorts
sudo port install kubectl
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get update && sudo apt-get install -y kubectl

# CentOS/RHEL
sudo yum install -y kubectl
```

## Local Development Setup

### Option 1: Docker Desktop with Kubernetes

1. **Install Docker Desktop**
   - Download from: https://www.docker.com/products/docker-desktop
   - Enable Kubernetes in Docker Desktop settings

2. **Verify Installation**
   ```bash
   kubectl cluster-info
   kubectl get nodes
   ```

### Option 2: Minikube

1. **Install Minikube**
   ```bash
   # Windows
   choco install minikube

   # macOS
   brew install minikube

   # Linux
   curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
   sudo install minikube-linux-amd64 /usr/local/bin/minikube
   ```

2. **Start Minikube**
   ```bash
   minikube start --driver=docker --cpus=4 --memory=8192 --disk-size=20g
   ```

3. **Enable Add-ons**
   ```bash
   minikube addons enable ingress
   minikube addons enable metrics-server
   ```

### Option 3: Kind (Kubernetes in Docker)

1. **Install Kind**
   ```bash
   # Windows
   choco install kind

   # macOS
   brew install kind

   # Linux
   curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
   chmod +x ./kind
   sudo mv ./kind /usr/local/bin/kind
   ```

2. **Create Cluster**
   ```bash
   kind create cluster --name orchestrator --config k8s/kind-config.yaml
   ```

## Production Setup

### Cloud Providers

#### AWS EKS
```bash
# Install eksctl
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin

# Create cluster
eksctl create cluster \
  --name orchestrator-cluster \
  --region us-west-2 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 1 \
  --nodes-max 10 \
  --managed
```

#### Google GKE
```bash
# Install gcloud CLI
# Download from: https://cloud.google.com/sdk/docs/install

# Create cluster
gcloud container clusters create orchestrator-cluster \
  --zone us-central1-a \
  --num-nodes 3 \
  --machine-type e2-medium \
  --enable-autoscaling \
  --min-nodes 1 \
  --max-nodes 10
```

#### Azure AKS
```bash
# Install Azure CLI
# Download from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli

# Create cluster
az aks create \
  --resource-group orchestrator-rg \
  --name orchestrator-cluster \
  --node-count 3 \
  --enable-addons monitoring \
  --generate-ssh-keys
```

## Deployment

### 1. Build and Push Images

```bash
# Set your registry
export REGISTRY="your-registry.com"

# Build images
docker build -t $REGISTRY/orchestrator-backend:latest ./backend_orchestrator
docker build -t $REGISTRY/orchestrator-frontend:latest ./frontend_orchestrator

# Push images
docker push $REGISTRY/orchestrator-backend:latest
docker push $REGISTRY/orchestrator-frontend:latest
```

### 2. Update Image References

Edit the deployment files to use your registry:
```bash
sed -i "s|orchestrator-backend:latest|$REGISTRY/orchestrator-backend:latest|g" k8s/backend-deployment.yaml
sed -i "s|orchestrator-frontend:latest|$REGISTRY/orchestrator-frontend:latest|g" k8s/frontend-deployment.yaml
```

### 3. Deploy Application

```bash
# Make script executable (Linux/macOS)
chmod +x k8s/deploy.sh

# Deploy with image building
./k8s/deploy.sh --build

# Or deploy using existing images
./k8s/deploy.sh
```

### 4. Manual Deployment Steps

If you prefer manual deployment:

```bash
# Create namespaces
kubectl apply -f k8s/namespace.yaml

# Deploy secrets and configmaps
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml

# Deploy MongoDB
kubectl apply -f k8s/mongodb-statefulset.yaml

# Wait for MongoDB
kubectl wait --for=condition=ready pod -l app=mongodb -n orchestrator --timeout=300s

# Deploy backend
kubectl apply -f k8s/backend-deployment.yaml

# Deploy frontend
kubectl apply -f k8s/frontend-deployment.yaml

# Deploy ingress
kubectl apply -f k8s/ingress.yaml

# Deploy monitoring
kubectl apply -f k8s/monitoring.yaml

# Deploy autoscaling
kubectl apply -f k8s/hpa.yaml

# Deploy network policies
kubectl apply -f k8s/network-policy.yaml
```

## Monitoring & Observability

### Install Prometheus Stack

```bash
# Add Prometheus Helm repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus stack
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set grafana.enabled=true \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false
```

### Access Monitoring

```bash
# Port forward to Grafana
kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring

# Port forward to Prometheus
kubectl port-forward svc/prometheus-kube-prometheus-prometheus 9090:9090 -n monitoring
```

## Accessing the Application

### Local Development

```bash
# Port forward to frontend
kubectl port-forward svc/frontend-orchestrator 8080:80 -n orchestrator

# Access application
open http://localhost:8080
```

### Production

Update your DNS to point to your cluster's ingress IP:

```bash
# Get ingress IP
kubectl get ingress -n orchestrator

# Add to /etc/hosts (Linux/macOS) or C:\Windows\System32\drivers\etc\hosts (Windows)
# <INGRESS_IP> orchestrator.example.com
```

## Useful Commands

### Check Status
```bash
# Check pods
kubectl get pods -n orchestrator

# Check services
kubectl get services -n orchestrator

# Check ingress
kubectl get ingress -n orchestrator

# Check HPA
kubectl get hpa -n orchestrator
```

### View Logs
```bash
# Backend logs
kubectl logs -f deployment/backend-orchestrator -n orchestrator

# Frontend logs
kubectl logs -f deployment/frontend-orchestrator -n orchestrator

# MongoDB logs
kubectl logs -f statefulset/mongodb -n orchestrator
```

### Scaling
```bash
# Scale backend
kubectl scale statefulset backend-orchestrator --replicas=5 -n orchestrator

# Scale frontend
kubectl scale deployment frontend-orchestrator --replicas=5 -n orchestrator
```

### Troubleshooting
```bash
# Describe pod
kubectl describe pod <pod-name> -n orchestrator

# Exec into pod
kubectl exec -it <pod-name> -n orchestrator -- /bin/bash

# Check events
kubectl get events -n orchestrator --sort-by='.lastTimestamp'
```

## Security Considerations

1. **Update Secrets**: Change default secrets in `k8s/secrets.yaml`
2. **Network Policies**: Review and customize network policies
3. **RBAC**: Implement proper role-based access control
4. **TLS**: Configure proper TLS certificates
5. **Image Security**: Use signed images and vulnerability scanning

## Backup & Recovery

### MongoDB Backup
```bash
# Create backup
kubectl exec mongodb-0 -n orchestrator -- mongodump --out /backup

# Copy backup from pod
kubectl cp orchestrator/mongodb-0:/backup ./mongodb-backup
```

### Application Backup
```bash
# Export configurations
kubectl get configmap -n orchestrator -o yaml > backup/configmaps.yaml
kubectl get secret -n orchestrator -o yaml > backup/secrets.yaml
```

## Performance Tuning

### Resource Limits
- Adjust CPU and memory limits in deployment files
- Monitor resource usage with Prometheus
- Use HPA for automatic scaling

### Database Optimization
- Configure MongoDB replica set properly
- Monitor database performance
- Implement connection pooling

### Network Optimization
- Use appropriate network policies
- Configure ingress with proper timeouts
- Implement rate limiting

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review Kubernetes logs
3. Check application logs
4. Verify network connectivity
5. Review resource usage 