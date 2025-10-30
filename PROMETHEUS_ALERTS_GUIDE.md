# 🚨 Prometheus Alerts Configuration Guide

## 🎯 Overview

This guide shows you how to configure Prometheus alerts for your orchestrator application.

---

## 🚀 Quick Setup

### **Step 1: Deploy Alert Rules**

```bash
# Apply the alert rules ConfigMap
kubectl apply -f k8s/prometheus-alerts.yaml

# Verify it was created
kubectl get configmap prometheus-alerts -n monitoring
```

### **Step 2: Update Prometheus Deployment**

```bash
# Apply updated Prometheus deployment (with alerts volume)
kubectl apply -f k8s/prometheus-deployment.yaml

# Restart Prometheus to load alerts
kubectl rollout restart deployment/prometheus -n monitoring

# Wait for it to be ready
kubectl wait --for=condition=Ready pod -l app=prometheus -n monitoring --timeout=120s
```

### **Step 3: Verify Alerts are Loaded**

```bash
# Port-forward Prometheus
kubectl port-forward -n monitoring svc/prometheus-nodeport 9090:9090

# Or access directly
# http://192.168.11.143:30090
```

**In Prometheus UI:**
1. Go to **Alerts** tab
2. You should see all configured alerts
3. Alerts will be in "Inactive" state (no issues) or "Pending/Firing" (issues detected)

---

## 📋 **Configured Alerts**

### **Application Alerts:**

| Alert | Threshold | Severity | Description |
|-------|-----------|----------|-------------|
| OrchestratorPodDown | Pod not Running for 5min | Critical | Pod is down |
| OrchestratorPodCrashLooping | Restarts in 15min | Warning | Pod restarting frequently |
| HighMemoryUsage | >85% for 5min | Warning | Memory usage high |
| CriticalMemoryUsage | >95% for 2min | Critical | Memory critically high |
| HighCPUUsage | >80% for 10min | Warning | CPU usage high |
| BackendPodNotReady | Pod not ready 3min | Critical | Backend pod unhealthy |
| BackendReplicasDown | Replicas < desired | Critical | Backend scaled down |
| FrontendPodNotReady | Pod not ready 3min | Critical | Frontend pod unhealthy |
| FrontendReplicasDown | Replicas < desired | Critical | Frontend scaled down |

### **Cluster Alerts:**

| Alert | Threshold | Severity | Description |
|-------|-----------|----------|-------------|
| NodeNotReady | Node not ready 5min | Critical | Kubernetes node down |
| NodeHighMemoryPressure | Memory pressure | Warning | Node low on memory |
| NodeHighDiskPressure | Disk pressure | Warning | Node low on disk space |

### **Storage Alerts:**

| Alert | Threshold | Severity | Description |
|-------|-----------|----------|-------------|
| PersistentVolumeLowSpace | <15% free for 10min | Warning | PV running out of space |
| PersistentVolumeCriticalSpace | <5% free for 5min | Critical | PV almost full |

---

## 🔔 **View Alerts in Prometheus**

### **Access Prometheus:**
```
http://192.168.11.143:30090
```

### **Check Alerts:**
1. Click **Alerts** in top menu
2. See all configured alerts
3. Alert states:
   - **Inactive** (Green) - All good
   - **Pending** (Yellow) - Condition met, waiting for duration
   - **Firing** (Red) - Alert triggered!

### **Query Alerts:**

```promql
# See all firing alerts
ALERTS{alertstate="firing"}

# See all alerts for orchestrator
ALERTS{component="orchestrator"}

# See critical alerts
ALERTS{severity="critical"}
```

---

## 📧 **Configure Alert Notifications (Optional)**

To actually send alerts (email, Slack, etc.), you need AlertManager:

### **Option 1: Use Prometheus Stack (Has AlertManager)**

If you're using `prometheus-stack`, AlertManager is already installed:

```bash
# Check AlertManager
kubectl get pods -n monitoring | grep alertmanager

# Access AlertManager UI
kubectl port-forward -n monitoring svc/alertmanager-operated 9093:9093

# Open: http://localhost:9093
```

### **Option 2: Deploy Standalone AlertManager**

Create `k8s/alertmanager-config.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-config
  namespace: monitoring
data:
  alertmanager.yml: |
    global:
      resolve_timeout: 5m
    
    route:
      group_by: ['alertname', 'cluster']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 12h
      receiver: 'email-notifications'
      
    receivers:
    - name: 'email-notifications'
      email_configs:
      - to: 'your-email@example.com'
        from: 'prometheus@orchestrator.com'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'your-email@gmail.com'
        auth_password: 'your-app-password'
        
    - name: 'slack-notifications'
      slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
        channel: '#alerts'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

Deploy AlertManager:

```bash
kubectl apply -f k8s/alertmanager-config.yaml
kubectl apply -f k8s/alertmanager-deployment.yaml
```

### **Option 3: Webhook to Custom Service**

```yaml
receivers:
- name: 'webhook'
  webhook_configs:
  - url: 'http://your-service/alert-webhook'
    send_resolved: true
```

---

## 🧪 **Test Alerts**

### **Trigger a Test Alert:**

```bash
# Scale down backend to trigger alert
kubectl scale statefulset backend-orchestrator -n orchestrator --replicas=0

# Wait 3-5 minutes
# Check Prometheus Alerts tab - should show "BackendReplicasDown" firing

# Scale back up
kubectl scale statefulset backend-orchestrator -n orchestrator --replicas=1
```

### **Manually Fire Alert via PromQL:**

In Prometheus UI, go to Graph and query:

```promql
# See if any alert would fire right now
ALERTS
```

---

## 🔧 **Customize Alerts**

Edit `k8s/prometheus-alerts.yaml` and adjust:

### **Change Thresholds:**

```yaml
# Make memory alert more strict (70% instead of 85%)
- alert: HighMemoryUsage
  expr: (container_memory_usage_bytes / container_spec_memory_limit_bytes) > 0.70
```

### **Change Duration:**

```yaml
# Alert faster (1min instead of 5min)
- alert: OrchestratorPodDown
  for: 1m
```

### **Add New Alert:**

```yaml
- alert: CustomAlert
  expr: your_metric > threshold
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Custom alert"
    description: "Your custom description"
```

### **Apply Changes:**

```bash
# Update alerts
kubectl apply -f k8s/prometheus-alerts.yaml

# Reload Prometheus config (without restart)
kubectl exec -n monitoring <prometheus-pod> -- curl -X POST http://localhost:9090/-/reload

# Or restart
kubectl rollout restart deployment/prometheus -n monitoring
```

---

## 📊 **Monitor Alerts**

### **Via Prometheus UI:**
```
http://192.168.11.143:30090/alerts
```

### **Via Grafana:**

In Grafana, create an "Alerts" dashboard:

1. Add panel
2. Query: `ALERTS{alertstate="firing"}`
3. Visualization: Table
4. Shows all firing alerts in real-time

---

## ✅ **Quick Deploy Commands**

```bash
# Deploy everything
kubectl apply -f k8s/prometheus-alerts.yaml
kubectl apply -f k8s/prometheus-deployment.yaml

# Restart Prometheus
kubectl rollout restart deployment/prometheus -n monitoring

# Check alerts are loaded
kubectl port-forward -n monitoring svc/prometheus-nodeport 9090:9090
# Go to: http://localhost:9090/alerts
```

---

## 🎯 **What You Get:**

✅ **Automatic Monitoring** - Prometheus checks metrics every 15-30 seconds  
✅ **Smart Alerting** - Only fires after conditions persist (no false alarms)  
✅ **Severity Levels** - Critical vs Warning for different responses  
✅ **Detailed Info** - Know exactly what's wrong and where  
✅ **Self-Healing Ready** - Can trigger auto-remediation scripts  

---

**Deploy the alerts now to start monitoring your orchestrator!** 🚨


