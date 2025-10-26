# Complete Monitoring Setup - Docker Orchestrator

## ✅ You Have Prometheus Stack Installed!

Your monitoring stack includes:
- ✅ Prometheus (for metrics collection)
- ✅ Grafana (for visualization)
- ✅ Prometheus Operator (for easy configuration)
- ✅ Kube-state-metrics (Kubernetes metrics)
- ✅ Node Exporter (node metrics)

---

## 🚀 **Quick Setup (3 Steps)**

### **Step 1: Apply Updated Deployments**

```bash
# Apply updated deployments with Prometheus annotations
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# Create ServiceMonitor resources
kubectl apply -f k8s/servicemonitor-orchestrator.yaml
```

---

### **Step 2: Access Grafana**

```bash
# Get Grafana password
kubectl get secret -n monitoring prometheus-stack-grafana -o jsonpath="{.data.admin-password}" | base64 --decode
echo ""

# Port forward to access Grafana
kubectl port-forward -n monitoring svc/prometheus-stack-grafana 3000:80

# Open browser: http://localhost:3000
# Username: admin
# Password: (from command above)
```

---

### **Step 3: Import Dashboards**

In Grafana UI:

**Import Pre-built Kubernetes Dashboards:**

1. Click **+** (top menu) → **Import**
2. Enter Dashboard ID → Click **Load**
3. Select **Prometheus** data source → Click **Import**

**Recommended Dashboard IDs:**

| ID | Dashboard Name | Shows |
|----|----------------|-------|
| `315` | Kubernetes Cluster Monitoring | Overall cluster health |
| `7249` | Kubernetes Compute Resources Cluster | CPU, Memory, Network by namespace |
| `6417` | Kubernetes Pods | Pod metrics and status |
| `13770` | Kubernetes / System / CoreDNS | DNS metrics |
| `12114` | Kubernetes Deployment Statefulset Daemonset metrics | Your backend StatefulSet |

---

## 📊 **Create Custom Docker Orchestrator Dashboard**

### **Dashboard JSON Template**

Save this as `orchestrator-dashboard.json` and import it:

```json
{
  "dashboard": {
    "title": "Docker Orchestrator Monitoring",
    "panels": [
      {
        "title": "Running Pods",
        "targets": [
          {
            "expr": "count(kube_pod_status_phase{namespace=\"orchestrator\", phase=\"Running\"})"
          }
        ],
        "type": "stat"
      },
      {
        "title": "Backend CPU Usage",
        "targets": [
          {
            "expr": "sum(rate(container_cpu_usage_seconds_total{namespace=\"orchestrator\", pod=~\"backend-orchestrator.*\"}[5m])) * 100"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Backend Memory Usage (MB)",
        "targets": [
          {
            "expr": "sum(container_memory_usage_bytes{namespace=\"orchestrator\", pod=~\"backend-orchestrator.*\"}) / 1024 / 1024"
          }
        ],
        "type": "graph"
      }
    ]
  }
}
```

---

## 🔍 **Verify Monitoring is Working**

### **Check Prometheus Targets**

```bash
# Port forward Prometheus
kubectl port-forward -n monitoring prometheus-prometheus-stack-kube-prom-prometheus-0 9090:9090

# Open browser: http://localhost:9090
# Go to Status → Targets
# Look for your backend-orchestrator and frontend-orchestrator
```

### **Test Prometheus Queries**

In Prometheus UI, run these queries:

```promql
# Check if orchestrator pods are being monitored
up{namespace="orchestrator"}

# Pod count
count(kube_pod_info{namespace="orchestrator"})

# CPU usage
rate(container_cpu_usage_seconds_total{namespace="orchestrator"}[5m])
```

---

## 📈 **Key Metrics to Monitor**

### **Application Health**
```promql
# Pods running
count(kube_pod_status_phase{namespace="orchestrator", phase="Running"})

# Pod restarts
sum(kube_pod_container_status_restarts_total{namespace="orchestrator"})

# Pods not ready
count(kube_pod_status_phase{namespace="orchestrator", phase!="Running"})
```

### **Resource Usage**
```promql
# CPU by pod
sum(rate(container_cpu_usage_seconds_total{namespace="orchestrator"}[5m])) by (pod)

# Memory by pod
sum(container_memory_usage_bytes{namespace="orchestrator"}) by (pod)

# Network receive
sum(rate(container_network_receive_bytes_total{namespace="orchestrator"}[5m])) by (pod)

# Network transmit
sum(rate(container_network_transmit_bytes_total{namespace="orchestrator"}[5m])) by (pod)
```

### **Kubernetes Resources**
```promql
# Node CPU usage
100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Node memory usage
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Disk usage
(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100
```

---

## 🎨 **Grafana Dashboard Layout Example**

**Row 1: Overview**
- Running Pods (Stat)
- Total CPU Usage (Gauge)
- Total Memory Usage (Gauge)

**Row 2: Backend Metrics**
- Backend CPU (Time Series)
- Backend Memory (Time Series)
- Backend Replicas (Stat)

**Row 3: Frontend Metrics**
- Frontend CPU (Time Series)
- Frontend Memory (Time Series)
- Frontend Replicas (Stat)

**Row 4: Cluster Health**
- Node CPU (Time Series)
- Node Memory (Time Series)
- Disk Usage (Time Series)

---

## ✅ **Quick Setup Commands**

```bash
# 1. Apply ServiceMonitors
kubectl apply -f k8s/servicemonitor-orchestrator.yaml

# 2. Apply updated deployments
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# 3. Get Grafana password
kubectl get secret -n monitoring prometheus-stack-grafana -o jsonpath="{.data.admin-password}" | base64 --decode

# 4. Access Grafana
kubectl port-forward -n monitoring svc/prometheus-stack-grafana 3000:80

# 5. Login and import dashboards (IDs: 315, 7249, 6417)
```

---

## 🎯 **Files Created**

- ✅ `k8s/servicemonitor-orchestrator.yaml` - Monitor your apps
- ✅ `k8s/backend-deployment.yaml` - Updated with annotations
- ✅ `k8s/frontend-deployment.yaml` - Updated with annotations
- ✅ `GRAFANA_SETUP_EXISTING_PROMETHEUS.md` - This guide
- ✅ `MONITORING_SETUP_COMPLETE.md` - Complete reference

---

**Run the commands above and your Prometheus will start monitoring your Docker Orchestrator application!** 📊🚀

What's the Grafana password from the command? Then you can access the dashboards!


