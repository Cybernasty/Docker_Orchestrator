# 🐧 Ubuntu Kubernetes Cluster Deployment Guide

## 📋 Overview

This guide provides step-by-step instructions for deploying the Orchestrator application on an Ubuntu-based Kubernetes cluster with integrated DevSecOps tools.

## 🏗️ Cluster Architecture

- **Master Node**: Control plane components, ArgoCD, OPA Gatekeeper
- **Worker Nodes**: Application workloads, DevSecOps tools, monitoring
- **All Nodes**: Trivy, Falco, Prometheus node-exporter

## 🚀 Quick Start

### 1. Prerequisites

```bash
# Ensure kubectl is configured for your Ubuntu cluster
kubectl cluster-info
kubectl get nodes

# Verify cluster access
kubectl get pods --all-namespaces
```

### 2. Install DevSecOps Tools

```bash
# Run the DevSecOps tools installation script
chmod +x k8s/install-devsecops-tools.sh
./k8s/install-devsecops-tools.sh
```

### 3. Deploy Application

```bash
# Create namespace
kubectl create namespace orchestrator

# Apply configurations
kubectl apply -f k8s/configmap.yaml -n orchestrator
kubectl apply -f k8s/backend-deployment.yaml -n orchestrator
kubectl apply -f k8s/frontend-deployment.yaml -n orchestrator
kubectl apply -f k8s/services.yaml -n orchestrator
```

### 4. Install ArgoCD

```bash
# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Create NodePort service
kubectl apply -f k8s/argocd-config.yaml

# Get admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

## 🔧 DevSecOps Tools Access

| Tool | Namespace | Access Method | Purpose |
|------|-----------|---------------|---------|
| **Trivy** | trivy-system | DaemonSet | Vulnerability scanning |
| **SonarQube** | sonarqube | NodePort:30900 | Code quality analysis |
| **OWASP ZAP** | zap | NodePort:30800 | Security testing |
| **ArgoCD** | argocd | NodePort:30443 | GitOps deployment |
| **Prometheus** | monitoring | Internal | Metrics collection |
| **Grafana** | monitoring | NodePort:30300 | Monitoring dashboard |
| **Falco** | falco | DaemonSet | Runtime security |
| **OPA Gatekeeper** | gatekeeper-system | Internal | Policy enforcement |

## 🌐 Access URLs

- **SonarQube**: `http://<master-ip>:30900` (admin/admin)
- **ArgoCD**: `http://<master-ip>:30443` (admin/<password>)
- **Grafana**: `http://<master-ip>:30300` (admin/prom-operator)
- **OWASP ZAP API**: `http://<master-ip>:30800`
- **OWASP ZAP Web**: `http://<master-ip>:30890`

## 🔄 CI/CD Pipeline

The GitHub Actions pipeline automatically:
1. Runs security scans (Trivy, SonarQube, OWASP ZAP)
2. Builds and scans Docker images
3. Updates Kubernetes manifests
4. Syncs with ArgoCD for deployment

## 🛡️ Security Features

- **Vulnerability Scanning**: Trivy scans code and container images
- **Code Quality**: SonarQube analyzes code quality and security
- **Security Testing**: OWASP ZAP performs penetration testing
- **Runtime Security**: Falco monitors for suspicious activities
- **Policy Enforcement**: OPA Gatekeeper enforces security policies
- **Monitoring**: Prometheus and Grafana provide observability

## 📊 Monitoring

- **Metrics**: Prometheus collects metrics from all components
- **Dashboards**: Grafana provides comprehensive monitoring dashboards
- **Alerts**: Configurable alerts for security and performance issues
- **Logs**: Centralized logging for all applications

## 🔧 Configuration

### Environment Variables

Key configuration in `k8s/configmap.yaml`:
- `DOCKER_HOST`: `unix:///var/run/docker.sock`
- `CORS_ORIGIN`: `http://localhost:30080`
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Your JWT secret key

### Resource Limits

All DevSecOps tools have appropriate resource limits:
- CPU: 100m-1000m
- Memory: 256Mi-2Gi
- Storage: 5Gi-20Gi

## 🚨 Troubleshooting

### Common Issues

1. **Pod Startup Issues**:
   ```bash
   kubectl describe pod <pod-name> -n <namespace>
   kubectl logs <pod-name> -n <namespace>
   ```

2. **Service Access Issues**:
   ```bash
   kubectl get services -n <namespace>
   kubectl get endpoints -n <namespace>
   ```

3. **Storage Issues**:
   ```bash
   kubectl get pvc -n <namespace>
   kubectl describe pvc <pvc-name> -n <namespace>
   ```

### Health Checks

```bash
# Check all DevSecOps tools
kubectl get pods --all-namespaces | grep -E "(trivy|sonar|zap|argocd|prometheus|grafana|falco|gatekeeper)"

# Check application status
kubectl get pods -n orchestrator
kubectl get services -n orchestrator
```

## 📈 Scaling

### Horizontal Scaling

```bash
# Scale application replicas
kubectl scale deployment frontend-orchestrator --replicas=3 -n orchestrator
kubectl scale statefulset backend-orchestrator --replicas=3 -n orchestrator
```

### Vertical Scaling

Update resource limits in deployment manifests:
```yaml
resources:
  requests:
    memory: "1Gi"
    cpu: "500m"
  limits:
    memory: "2Gi"
    cpu: "1000m"
```

## 🔄 Updates and Maintenance

### Rolling Updates

```bash
# Update application images
kubectl set image deployment/frontend-orchestrator frontend=cybermonta/orchestrator-frontend:latest -n orchestrator
kubectl set image statefulset/backend-orchestrator backend=cybermonta/orchestrator-backend:latest -n orchestrator
```

### Backup

```bash
# Backup configurations
kubectl get all -n orchestrator -o yaml > orchestrator-backup.yaml
kubectl get configmap -n orchestrator -o yaml > configmap-backup.yaml
```

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [SonarQube Documentation](https://docs.sonarqube.org/)
- [OWASP ZAP Documentation](https://www.zaproxy.org/docs/)

## 🆘 Support

For issues and support:
1. Check the troubleshooting section above
2. Review application logs
3. Check DevSecOps tool status
4. Verify cluster connectivity
5. Check resource availability

---

**Note**: This guide assumes you have a working Ubuntu-based Kubernetes cluster. Ensure all prerequisites are met before proceeding with the deployment.








