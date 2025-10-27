# 🚀 Deploy Prometheus & Grafana - Quick Guide

## 📊 What You'll Deploy

- **Prometheus**: Metrics collection and storage
- **Grafana**: Beautiful dashboards and visualizations
- **Pre-configured dashboards** for your orchestrator application

---

## ⚡ Quick Deploy (5 minutes)

### **Step 1: Create Monitoring Namespace**

```bash
kubectl apply -f k8s/monitoring-namespace.yaml
```

### **Step 2: Deploy Prometheus**

```bash
# Deploy Prometheus configuration
kubectl apply -f k8s/prometheus-config.yaml

# Deploy Prometheus
kubectl apply -f k8s/prometheus-deployment.yaml

# Verify Prometheus is running
kubectl get pods -n monitoring -l app=prometheus
```

### **Step 3: Deploy Grafana**

```bash
# Deploy Grafana dashboards (if you have them)
kubectl apply -f k8s/grafana-dashboard-orchestrator.yaml

# Deploy Grafana
kubectl apply -f k8s/grafana-deployment.yaml

# Verify Grafana is running
kubectl get pods -n monitoring -l app=grafana
```

### **Step 4: Access the Dashboards**

```bash
# Get your node IP
kubectl get nodes -o wide

# Access URLs (replace with your node IP)
```

**Prometheus**: `http://192.168.11.143:30090`
**Grafana**: `http://192.168.11.143:30300`

**Grafana Credentials:**
- Username: `admin`
- Password: `admin123`

---

## 🎯 One-Command Deploy

Deploy everything at once:

```bash
kubectl apply -f k8s/monitoring-namespace.yaml && \
kubectl apply -f k8s/prometheus-config.yaml && \
kubectl apply -f k8s/prometheus-deployment.yaml && \
kubectl apply -f k8s/grafana-deployment.yaml && \
kubectl apply -f k8s/grafana-dashboard-orchestrator.yaml
```

Wait for pods to be ready:

```bash
kubectl wait --for=condition=Ready pods --all -n monitoring --timeout=300s
```

---

## ✅ Verify Installation

### **Check All Components:**

```bash
# Check all monitoring pods
kubectl get pods -n monitoring

# Expected output:
# NAME                          READY   STATUS    RESTARTS   AGE
# prometheus-xxxxxxxxxx-xxxxx   1/1     Running   0          2m
# grafana-xxxxxxxxxx-xxxxx      1/1     Running   0          2m
```

### **Check Services:**

```bash
kubectl get svc -n monitoring

# Expected output:
# NAME                   TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
# prometheus             ClusterIP   10.x.x.x        <none>        9090/TCP         2m
# prometheus-nodeport    NodePort    10.x.x.x        <none>        9090:30090/TCP   2m
# grafana                ClusterIP   10.x.x.x        <none>        3000/TCP         2m
# grafana-nodeport       NodePort    10.x.x.x        <none>        3000:30300/TCP   2m
```

---

## 📊 Access Dashboards

### **Prometheus UI:**

1. Open: `http://192.168.11.143:30090`
2. Go to **Status** → **Targets** to see monitored services
3. Try some queries:

```promql
# Container CPU usage
rate(container_cpu_usage_seconds_total{namespace="orchestrator"}[5m])

# Container memory usage
container_memory_usage_bytes{namespace="orchestrator"}

# Pod count
count(kube_pod_info{namespace="orchestrator"})
```

### **Grafana UI:**

1. Open: `http://192.168.11.143:30300`
2. Login with `admin` / `admin123`
3. Navigate to **Dashboards** → Browse
4. You should see pre-loaded dashboards:
   - **Orchestrator Overview**
   - **Orchestrator Containers**

---

## 🎨 Import Additional Dashboards

### **Popular Kubernetes Dashboards:**

1. In Grafana, click **+** → **Import Dashboard**
2. Enter dashboard ID and click **Load**
3. Select Prometheus as data source
4. Click **Import**

**Recommended Dashboard IDs:**

| Dashboard | ID | Description |
|-----------|----|----|
| Kubernetes Cluster Monitoring | 315 | Overall cluster health |
| Kubernetes Pod Monitoring | 6417 | Pod metrics and resources |
| Node Exporter Full | 1860 | Detailed node metrics |
| Kubernetes Deployment | 8588 | Deployment statistics |

---

## 🔧 Configuration Details

### **Prometheus:**
- **Port**: 30090 (NodePort)
- **Data Retention**: 30 days
- **Storage**: 10Gi PVC
- **Scrape Interval**: 15 seconds

### **Grafana:**
- **Port**: 30300 (NodePort)
- **Default User**: admin
- **Default Password**: admin123
- **Storage**: 5Gi PVC
- **Auto-configured**: Prometheus datasource

### **Monitored Services:**
- Kubernetes API Server
- Kubernetes Nodes
- Kubernetes Pods
- Orchestrator Backend
- Orchestrator Frontend

---

## 📈 Useful Prometheus Queries

### **Application Metrics:**

```promql
# Backend pods running
count(kube_pod_info{namespace="orchestrator", pod=~"backend-orchestrator.*"})

# Frontend pods running
count(kube_pod_info{namespace="orchestrator", pod=~"frontend-orchestrator.*"})

# Container restarts (high = problem)
kube_pod_container_status_restarts_total{namespace="orchestrator"}

# Memory usage percentage
(container_memory_usage_bytes{namespace="orchestrator"} / container_spec_memory_limit_bytes{namespace="orchestrator"}) * 100

# CPU usage
rate(container_cpu_usage_seconds_total{namespace="orchestrator"}[5m])
```

### **Cluster Metrics:**

```promql
# Node CPU usage
100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Node memory usage
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Pods not running
kube_pod_status_phase{phase!="Running"} == 1
```

---

## 🚨 Troubleshooting

### **Issue 1: Pods Not Starting**

```bash
# Check pod status
kubectl describe pod -n monitoring <pod-name>

# Check logs
kubectl logs -n monitoring <pod-name>

# Common issue: PVC not bound
kubectl get pvc -n monitoring
```

**Fix:** Delete and recreate PVC if needed:
```bash
kubectl delete pvc prometheus-data grafana-data -n monitoring
kubectl apply -f k8s/prometheus-deployment.yaml
kubectl apply -f k8s/grafana-deployment.yaml
```

### **Issue 2: Can't Access Dashboards**

```bash
# Check if services are running
kubectl get svc -n monitoring

# Check NodePort is correct
kubectl get svc grafana-nodeport -n monitoring -o yaml | grep nodePort

# Test from within cluster
kubectl run test-pod --rm -it --image=curlimages/curl -- curl http://prometheus:9090/-/healthy
```

### **Issue 3: Grafana Shows No Data**

```bash
# Check if Prometheus datasource is configured
kubectl exec -n monitoring <grafana-pod> -- curl http://prometheus:9090/api/v1/query?query=up

# Check Prometheus targets
# Open: http://192.168.11.143:30090/targets
# All targets should be "UP"
```

### **Issue 4: Dashboards Not Loading**

```bash
# Check if dashboard ConfigMaps exist
kubectl get configmap -n monitoring | grep dashboard

# Recreate dashboards
kubectl apply -f k8s/grafana-dashboard-orchestrator.yaml

# Restart Grafana
kubectl rollout restart deployment/grafana -n monitoring
```

---

## 🔄 Update/Restart Services

```bash
# Restart Prometheus
kubectl rollout restart deployment/prometheus -n monitoring

# Restart Grafana
kubectl rollout restart deployment/grafana -n monitoring

# Check rollout status
kubectl rollout status deployment/prometheus -n monitoring
kubectl rollout status deployment/grafana -n monitoring
```

---

## 🗑️ Uninstall (if needed)

```bash
# Delete Grafana
kubectl delete -f k8s/grafana-deployment.yaml

# Delete Prometheus
kubectl delete -f k8s/prometheus-deployment.yaml
kubectl delete -f k8s/prometheus-config.yaml

# Delete namespace (removes everything)
kubectl delete namespace monitoring
```

---

## 📚 Next Steps

1. ✅ **Explore pre-configured dashboards**
2. ✅ **Import community dashboards** (IDs above)
3. ✅ **Create custom dashboards** for your app
4. ✅ **Set up alerts** (see below)
5. ✅ **Configure retention** policies

---

## 🔔 Optional: Setup Alerts

Create `k8s/prometheus-alerts.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-alerts
  namespace: monitoring
data:
  alerts.yml: |
    groups:
    - name: orchestrator
      interval: 30s
      rules:
      - alert: PodDown
        expr: kube_pod_status_phase{namespace="orchestrator", phase!="Running"} == 1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Pod {{ $labels.pod }} is down"
      
      - alert: HighMemoryUsage
        expr: (container_memory_usage_bytes{namespace="orchestrator"} / container_spec_memory_limit_bytes{namespace="orchestrator"}) > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.pod }}"
```

Apply alerts:
```bash
kubectl apply -f k8s/prometheus-alerts.yaml
```

---

## 🎉 Success!

Your monitoring stack is now running!

**Access:**
- **Prometheus**: http://192.168.11.143:30090
- **Grafana**: http://192.168.11.143:30300 (admin/admin123)

**Monitor your orchestrator application in real-time!** 📊

---

**Related Docs:**
- `GRAFANA_PROMETHEUS_SETUP.md` - Detailed setup
- `GRAFANA_SETUP_EXISTING_STACK.md` - Advanced configuration
- `MONITORING_SETUP_COMPLETE.md` - Complete guide

