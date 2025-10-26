# Grafana & Prometheus Setup Guide - Kubernetes Monitoring

## 🎯 Overview

This guide helps you set up Grafana and Prometheus to monitor your Kubernetes cluster and Docker Orchestrator application.

---

## 📋 **What You'll Get**

✅ **Prometheus** - Metrics collection from:
- Kubernetes cluster (nodes, pods, services)
- Docker Orchestrator backend
- Docker Orchestrator frontend
- System resources (CPU, memory, network)

✅ **Grafana** - Visualization dashboards for:
- Cluster health and resources
- Pod metrics
- Application performance
- Custom Docker Orchestrator metrics

---

## 🚀 **Quick Deployment**

### **Step 1: Create Monitoring Namespace**

```bash
kubectl apply -f k8s/monitoring-namespace.yaml
```

---

### **Step 2: Deploy Prometheus**

```bash
# Apply Prometheus configuration
kubectl apply -f k8s/prometheus-config.yaml

# Deploy Prometheus
kubectl apply -f k8s/prometheus-deployment.yaml

# Wait for Prometheus to be ready
kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=120s

# Verify
kubectl get pods -n monitoring
```

---

### **Step 3: Deploy Grafana**

```bash
# Deploy Grafana
kubectl apply -f k8s/grafana-deployment.yaml

# Wait for Grafana to be ready
kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=120s

# Verify
kubectl get pods -n monitoring
```

---

### **Step 4: Access Grafana**

```bash
# Get NodePort
kubectl get svc -n monitoring grafana-nodeport

# Access via browser:
# http://<node-ip>:30300
```

**Login credentials:**
- Username: `admin`
- Password: `admin123`

---

### **Step 5: Access Prometheus (Optional)**

```bash
# Access Prometheus UI
# http://<node-ip>:30090
```

---

## 📊 **Configure Grafana Dashboards**

### **Method 1: Import Pre-built Dashboards**

Once logged into Grafana:

1. Click **+** (Create) → **Import**
2. Enter dashboard ID:
   - **Kubernetes Cluster Monitoring**: `315`
   - **Kubernetes Pods**: `6417`
   - **Node Exporter Full**: `1860`
   - **Kubernetes API Server**: `12006`

3. Click **Load**
4. Select **Prometheus** as data source
5. Click **Import**

---

### **Method 2: Create Custom Dashboard for Docker Orchestrator**

1. Click **+** → **Dashboard**
2. Add panels for:
   - **Container Count**: Query: `count(kube_pod_info{namespace="orchestrator"})`
   - **Backend CPU**: Query: `rate(container_cpu_usage_seconds_total{pod=~"backend-orchestrator.*"}[5m])`
   - **Backend Memory**: Query: `container_memory_usage_bytes{pod=~"backend-orchestrator.*"}`
   - **API Request Rate**: Query: `rate(http_requests_total[5m])`

---

## 🔧 **Enable Metrics on Your Applications**

### **Add Prometheus Annotations to Backend Deployment**

Update `k8s/backend-deployment.yaml` to add Prometheus scrape annotations:

```yaml
spec:
  template:
    metadata:
      labels:
        app: backend-orchestrator
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "5000"
        prometheus.io/path: "/metrics"
```

Then apply:
```bash
kubectl apply -f k8s/backend-deployment.yaml
```

---

### **Add Metrics Endpoint to Backend** (Optional)

If you want custom application metrics, install prom-client:

```bash
cd backend_orchestrator
npm install prom-client
```

Add to `server.js`:

```javascript
import promClient from 'prom-client';

// Create a Registry
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});
register.registerMetric(httpRequestDuration);

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

---

## 📊 **Access Information**

| Service | URL | Credentials |
|---------|-----|-------------|
| **Grafana UI** | `http://<node-ip>:30300` | admin / admin123 |
| **Prometheus UI** | `http://<node-ip>:30090` | No auth |
| **Prometheus API** | `http://prometheus:9090` (in-cluster) | - |

---

## 🎯 **Useful Prometheus Queries**

### **Kubernetes Cluster**

```promql
# Node CPU usage
100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Node Memory usage
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Pod count by namespace
count(kube_pod_info) by (namespace)

# Pods not running
kube_pod_status_phase{phase!="Running"} == 1
```

### **Docker Orchestrator Application**

```promql
# Backend pods running
count(kube_pod_info{namespace="orchestrator", pod=~"backend-orchestrator.*"})

# Frontend pods running
count(kube_pod_info{namespace="orchestrator", pod=~"frontend-orchestrator.*"})

# Backend CPU usage
rate(container_cpu_usage_seconds_total{pod=~"backend-orchestrator.*"}[5m])

# Backend Memory usage
container_memory_usage_bytes{pod=~"backend-orchestrator.*"}

# Container restarts
kube_pod_container_status_restarts_total{namespace="orchestrator"}
```

---

## 🔔 **Set Up Alerts (Optional)**

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
          description: "Pod {{ $labels.pod }} in namespace {{ $labels.namespace }} has been down for more than 5 minutes"
      
      - alert: HighMemoryUsage
        expr: (container_memory_usage_bytes{namespace="orchestrator"} / container_spec_memory_limit_bytes{namespace="orchestrator"}) > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.pod }}"
      
      - alert: HighCPUUsage
        expr: rate(container_cpu_usage_seconds_total{namespace="orchestrator"}[5m]) > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.pod }}"
```

---

## 🧪 **Verify Setup**

### **Check Prometheus Targets**

1. Open Prometheus UI: `http://<node-ip>:30090`
2. Go to **Status** → **Targets**
3. Should see:
   - ✅ kubernetes-apiservers (UP)
   - ✅ kubernetes-nodes (UP)
   - ✅ kubernetes-pods (UP)
   - ✅ orchestrator-backend (UP)
   - ✅ orchestrator-frontend (UP)

### **Check Grafana Data Source**

1. Open Grafana: `http://<node-ip>:30300`
2. Login: admin / admin123
3. Go to **Configuration** → **Data Sources**
4. Should see: **Prometheus** (default)
5. Click **Test** → Should show "Data source is working"

---

## 📈 **Recommended Dashboards**

### **1. Kubernetes Cluster Overview**
- Dashboard ID: **315**
- Shows: Nodes, pods, CPU, memory, network

### **2. Kubernetes Pods**
- Dashboard ID: **6417**
- Shows: Pod metrics, restarts, resource usage

### **3. Node Exporter Full**
- Dashboard ID: **1860**
- Shows: Detailed node metrics

### **4. Kubernetes API Server**
- Dashboard ID: **12006**
- Shows: API server performance

---

## 🎨 **Custom Dashboard for Docker Orchestrator**

Create a new dashboard with these panels:

### **Panel 1: Total Containers**
```promql
count(kube_pod_info{namespace="orchestrator"})
```

### **Panel 2: Backend Pods Status**
```promql
count(kube_pod_status_phase{namespace="orchestrator", pod=~"backend.*", phase="Running"})
```

### **Panel 3: Frontend Pods Status**
```promql
count(kube_pod_status_phase{namespace="orchestrator", pod=~"frontend.*", phase="Running"})
```

### **Panel 4: Pod Restart Count**
```promql
sum(kube_pod_container_status_restarts_total{namespace="orchestrator"}) by (pod)
```

### **Panel 5: Memory Usage**
```promql
sum(container_memory_usage_bytes{namespace="orchestrator"}) by (pod)
```

### **Panel 6: CPU Usage**
```promql
sum(rate(container_cpu_usage_seconds_total{namespace="orchestrator"}[5m])) by (pod)
```

---

## 🔧 **Troubleshooting**

### **Prometheus Not Scraping Targets**

```bash
# Check Prometheus logs
kubectl logs -n monitoring -l app=prometheus

# Check ServiceAccount permissions
kubectl get clusterrolebinding prometheus

# Verify config
kubectl get configmap prometheus-config -n monitoring -o yaml
```

### **Grafana Can't Connect to Prometheus**

```bash
# Test connection from Grafana pod
kubectl exec -n monitoring -it $(kubectl get pod -n monitoring -l app=grafana -o jsonpath='{.items[0].metadata.name}') -- curl http://prometheus:9090/api/v1/query?query=up

# Should return metrics data
```

### **No Data Showing in Grafana**

1. Check Prometheus is collecting data: `http://<node-ip>:30090/targets`
2. Check time range in Grafana (top right)
3. Verify query is correct
4. Check data source connection

---

## ✅ **Deployment Checklist**

- [ ] Monitoring namespace created
- [ ] Prometheus deployed
- [ ] Prometheus scraping targets
- [ ] Grafana deployed
- [ ] Grafana connected to Prometheus
- [ ] Dashboards imported
- [ ] Can see Kubernetes metrics
- [ ] Can see application metrics
- [ ] Alerts configured (optional)

---

## 🎯 **Quick Deployment Commands**

```bash
# Deploy everything
kubectl apply -f k8s/monitoring-namespace.yaml
kubectl apply -f k8s/prometheus-config.yaml
kubectl apply -f k8s/prometheus-deployment.yaml
kubectl apply -f k8s/grafana-deployment.yaml

# Wait for pods
kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=120s
kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=120s

# Check status
kubectl get pods -n monitoring
kubectl get svc -n monitoring

# Access
echo "Grafana: http://<node-ip>:30300 (admin/admin123)"
echo "Prometheus: http://<node-ip>:30090"
```

---

**Deploy now and start monitoring your cluster!** 📊🚀

