# Grafana Setup with Existing Prometheus Stack

## 🎯 You Already Have Prometheus - Perfect!

Since you have the Prometheus stack installed, you just need to:
1. Configure it to monitor your Docker Orchestrator application
2. Create Grafana dashboards
3. Access and visualize

---

## 📊 **Step 1: Enable Monitoring on Your Apps**

### **Update Backend Deployment**

I've added Prometheus annotations to `k8s/backend-deployment.yaml`:

```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "5000"
  prometheus.io/path: "/metrics"
```

### **Update Frontend Deployment**

I've added annotations to `k8s/frontend-deployment.yaml` as well.

### **Apply Changes**

```bash
# Apply updated deployments
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# Restart pods
kubectl rollout restart statefulset/backend-orchestrator -n orchestrator
kubectl rollout restart deployment/frontend-orchestrator -n orchestrator
```

---

## 🌐 **Step 2: Access Grafana**

```bash
# Find Grafana service
kubectl get svc -n monitoring | grep grafana

# If it's a NodePort service:
# Access at: http://<node-ip>:<nodePort>

# If it's ClusterIP, port-forward:
kubectl port-forward -n monitoring svc/<grafana-service-name> 3000:3000

# Access at: http://localhost:3000
```

**Default credentials** (usually):
- Username: `admin`
- Password: `prom-operator` or `admin`

---

## 📊 **Step 3: Import Kubernetes Dashboards**

In Grafana:

1. Click **+** → **Import**
2. Enter dashboard ID and click **Load**:

### **Essential Dashboards:**

| Dashboard | ID | What It Shows |
|-----------|-----|---------------|
| **Kubernetes Cluster Monitoring** | `315` | Overall cluster health |
| **Kubernetes / Compute Resources / Cluster** | `7249` | CPU, Memory, Network |
| **Kubernetes / Compute Resources / Namespace (Pods)** | `6417` | Pod metrics |
| **Kubernetes / Compute Resources / Pod** | `6336` | Individual pod metrics |
| **Node Exporter Full** | `1860` | Node details |

3. Select **Prometheus** as data source
4. Click **Import**

---

## 🎨 **Step 4: Create Custom Dashboard for Docker Orchestrator**

### **Create New Dashboard**

1. Click **+** → **Dashboard** → **Add new panel**

### **Panel 1: Orchestrator Pods Status**

```promql
# Query
count(kube_pod_status_phase{namespace="orchestrator", phase="Running"})

# Title: "Running Pods"
# Visualization: Stat
```

### **Panel 2: Backend CPU Usage**

```promql
# Query
sum(rate(container_cpu_usage_seconds_total{namespace="orchestrator", pod=~"backend-orchestrator.*"}[5m])) * 100

# Title: "Backend CPU Usage (%)"
# Visualization: Time series
```

### **Panel 3: Backend Memory Usage**

```promql
# Query
sum(container_memory_usage_bytes{namespace="orchestrator", pod=~"backend-orchestrator.*"}) / 1024 / 1024

# Title: "Backend Memory (MB)"
# Visualization: Time series
```

### **Panel 4: Pod Restart Count**

```promql
# Query
sum(kube_pod_container_status_restarts_total{namespace="orchestrator"}) by (pod)

# Title: "Pod Restarts"
# Visualization: Table
```

### **Panel 5: Backend Replicas**

```promql
# Query
count(kube_pod_info{namespace="orchestrator", pod=~"backend.*"})

# Title: "Backend Replicas"
# Visualization: Stat
```

### **Panel 6: Frontend Replicas**

```promql
# Query
count(kube_pod_info{namespace="orchestrator", pod=~"frontend.*"})

# Title: "Frontend Replicas"
# Visualization: Stat
```

---

## 🔍 **Step 5: Verify Prometheus is Scraping**

1. **Access Prometheus UI**:
   ```bash
   kubectl port-forward -n monitoring svc/<prometheus-service-name> 9090:9090
   # Open: http://localhost:9090
   ```

2. **Check Targets**:
   - Go to **Status** → **Targets**
   - Look for your application targets
   - Should show state: **UP**

3. **Test Query**:
   - Go to **Graph** tab
   - Query: `up{namespace="orchestrator"}`
   - Should return results

---

## 📋 **Quick Monitoring Queries for Docker Orchestrator**

```promql
# All pods in orchestrator namespace
count(kube_pod_info{namespace="orchestrator"})

# Backend pods running
count(kube_pod_status_phase{namespace="orchestrator", pod=~"backend.*", phase="Running"})

# Frontend pods running
count(kube_pod_status_phase{namespace="orchestrator", pod=~"frontend.*", phase="Running"})

# Total CPU usage (orchestrator namespace)
sum(rate(container_cpu_usage_seconds_total{namespace="orchestrator"}[5m]))

# Total memory usage (orchestrator namespace)
sum(container_memory_usage_bytes{namespace="orchestrator"})

# Network I/O
sum(rate(container_network_receive_bytes_total{namespace="orchestrator"}[5m]))
sum(rate(container_network_transmit_bytes_total{namespace="orchestrator"}[5m]))

# Pod restarts in last 24h
increase(kube_pod_container_status_restarts_total{namespace="orchestrator"}[24h])
```

---

## 🎯 **Complete Setup Commands**

```bash
# 1. Add monitoring annotations to deployments (already done ✅)
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# 2. Restart pods to apply annotations
kubectl rollout restart statefulset/backend-orchestrator -n orchestrator
kubectl rollout restart deployment/frontend-orchestrator -n orchestrator

# 3. Access Grafana
kubectl get svc -n monitoring | grep grafana

# 4. Login to Grafana and import dashboards

# 5. Verify data is flowing
# Grafana → Explore → Select Prometheus → Query: up{namespace="orchestrator"}
```

---

## ✅ **What You'll Monitor**

- ✅ **Cluster**: Nodes, CPU, Memory, Network
- ✅ **Orchestrator Pods**: Status, restarts, resource usage
- ✅ **Backend**: CPU, Memory, Network, Replicas
- ✅ **Frontend**: CPU, Memory, Network, Replicas
- ✅ **Containers**: Docker containers managed by your app
- ✅ **MongoDB**: Connection status (if metrics exposed)

---

## 🌐 **Access Your Grafana**

What's the output of this command?

```bash
kubectl get svc -n monitoring
```

This will show me how to access your existing Grafana instance! 📊


