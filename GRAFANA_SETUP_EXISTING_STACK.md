# Grafana Setup Guide - Using Existing Prometheus Stack

## Your Current Setup ✅

You have the **Prometheus Operator Stack** already running with:
- ✅ **Grafana**: `prometheus-stack-grafana` (port 80)
- ✅ **Prometheus**: `prometheus-stack-kube-prom-prometheus` (port 9090)
- ✅ **Alertmanager**: `prometheus-stack-kube-prom-alertmanager`
- ✅ **Node Exporter**: Collecting node metrics
- ✅ **Kube State Metrics**: Collecting cluster metrics

---

## Step 1: Access Existing Grafana 🔐

```bash
# Get the admin password for Grafana
kubectl get secret -n monitoring prometheus-stack-grafana -o jsonpath="{.data.admin-password}" | base64 --decode
echo

# Port forward to access Grafana
kubectl port-forward -n monitoring svc/prometheus-stack-grafana 3000:80

# Open browser: http://localhost:3000
# Username: admin
# Password: [from command above]
```

---

## Step 2: Verify Prometheus Data Source 📊

1. Open Grafana: http://localhost:3000
2. Go to **Configuration** → **Data Sources**
3. You should see **Prometheus** already configured
4. URL should be: `http://prometheus-stack-kube-prom-prometheus:9090`
5. Click **Test** to verify connection ✅

---

## Step 3: Apply ServiceMonitor for Your Apps 🎯

```bash
# Apply the ServiceMonitor we created
kubectl apply -f k8s/servicemonitor-orchestrator.yaml

# Verify it was created
kubectl get servicemonitor -n monitoring

# Expected output:
# NAME                     AGE
# backend-orchestrator     1m
# frontend-orchestrator    1m
```

---

## Step 4: Verify Prometheus is Scraping Your Apps 🔍

```bash
# Port forward Prometheus
kubectl port-forward -n monitoring svc/prometheus-stack-kube-prom-prometheus 9090:9090

# Open browser: http://localhost:9090
# Go to: Status → Targets
# Search for: "orchestrator"
# You should see:
#   - backend-orchestrator/backend-orchestrator (0/1 up) or (1/1 up)
#   - frontend-orchestrator/frontend-orchestrator (0/1 up) or (1/1 up)
```

**Note:** If targets show as DOWN, you need to add metrics endpoints to your backend/frontend.

---

## Step 5: Import Pre-Built Dashboards 📈

### A. Import Kubernetes Cluster Dashboard

1. In Grafana, click **+** → **Import**
2. Enter Dashboard ID: **15760** (Kubernetes Views - Global)
3. Select **Prometheus** as data source
4. Click **Import**

### B. Import Additional Useful Dashboards

```
Dashboard ID | Name | Description
-------------|------|-------------
15760 | Kubernetes Views - Global | Overall cluster health
15757 | Kubernetes Views - Namespaces | Namespace-level metrics
15758 | Kubernetes Views - Pods | Pod-level metrics
1860  | Node Exporter Full | Detailed node metrics
14981 | Kubernetes Monitoring | Comprehensive K8s monitoring
```

To import:
1. Go to **+** → **Import**
2. Enter the Dashboard ID
3. Select **Prometheus** data source
4. Click **Import**

---

## Step 6: Create Custom Orchestrator Dashboard 🎨

### A. Create New Dashboard

1. Click **+** → **Dashboard** → **Add new panel**
2. Use these queries for your orchestrator:

#### Panel 1: Pod Status
```promql
kube_pod_status_ready{namespace="orchestrator"}
```

#### Panel 2: CPU Usage
```promql
rate(container_cpu_usage_seconds_total{namespace="orchestrator"}[5m])
```

#### Panel 3: Memory Usage
```promql
container_memory_usage_bytes{namespace="orchestrator"}
```

#### Panel 4: Network Traffic
```promql
# Received
rate(container_network_receive_bytes_total{namespace="orchestrator"}[5m])

# Transmitted
rate(container_network_transmit_bytes_total{namespace="orchestrator"}[5m])
```

### B. Save the Dashboard
1. Click **Save dashboard** (disk icon)
2. Name: "Orchestrator Overview"
3. Click **Save**

---

## Step 7: Add Application-Specific Metrics (Backend) 🔧

To get more detailed metrics, add Prometheus client to your backend:

### Install prom-client

```bash
cd backend_orchestrator
npm install prom-client
```

### Update `backend_orchestrator/server.js`

Add metrics endpoint:

```javascript
const express = require('express');
const promClient = require('prom-client');

const app = express();

// Prometheus metrics setup
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);

// Middleware to track metrics
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.labels(req.method, req.route?.path || req.path, res.statusCode).observe(duration);
    httpRequestsTotal.labels(req.method, req.route?.path || req.path, res.statusCode).inc();
  });
  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Your existing routes...
```

### Rebuild and deploy backend

```bash
# Build new image
docker build -t localhost:6500/backend-orchestrator:latest ./backend_orchestrator

# Push to registry
docker push localhost:6500/backend-orchestrator:latest

# Restart backend pods
kubectl rollout restart statefulset/backend-orchestrator -n orchestrator
```

---

## Step 8: Verify Metrics are Flowing 🌊

```bash
# Test metrics endpoint locally (if running locally)
curl http://localhost:5000/metrics

# Test from within cluster
kubectl exec -n orchestrator backend-orchestrator-0 -- curl localhost:5000/metrics

# Check Prometheus targets again
kubectl port-forward -n monitoring svc/prometheus-stack-kube-prom-prometheus 9090:9090
# Go to: http://localhost:9090/targets
# Look for orchestrator targets - should be UP ✅
```

---

## Step 9: Create Advanced Queries in Grafana 📊

### HTTP Request Rate
```promql
rate(http_requests_total{namespace="orchestrator"}[5m])
```

### Error Rate (4xx and 5xx)
```promql
sum(rate(http_requests_total{namespace="orchestrator", status_code=~"4..|5.."}[5m]))
```

### P95 Latency
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{namespace="orchestrator"}[5m]))
```

### Pod Restart Count
```promql
rate(kube_pod_container_status_restarts_total{namespace="orchestrator"}[15m])
```

### Container Memory Usage (%)
```promql
(container_memory_usage_bytes{namespace="orchestrator"} / container_spec_memory_limit_bytes{namespace="orchestrator"}) * 100
```

---

## Step 10: Set Up Alerts 🚨

### A. Create Alert Rule in Grafana

1. Go to **Alerting** → **Alert rules** → **New alert rule**
2. Example: High Error Rate

```yaml
Name: High Error Rate - Orchestrator
Query: sum(rate(http_requests_total{namespace="orchestrator", status_code=~"5.."}[5m])) > 0.1
Condition: WHEN last() OF query(A) IS ABOVE 0.1
For: 5m
```

### B. Configure Notification Channels

1. Go to **Alerting** → **Contact points** → **New contact point**
2. Add:
   - **Email**: yourteam@example.com
   - **Slack**: #monitoring-alerts
   - **Webhook**: For custom integrations

---

## Quick Reference Commands 🚀

```bash
# Access Grafana
kubectl port-forward -n monitoring svc/prometheus-stack-grafana 3000:80

# Access Prometheus
kubectl port-forward -n monitoring svc/prometheus-stack-kube-prom-prometheus 9090:9090

# Check ServiceMonitors
kubectl get servicemonitor -n monitoring

# Check Prometheus targets
kubectl port-forward -n monitoring svc/prometheus-stack-kube-prom-prometheus 9090:9090
# Then open: http://localhost:9090/targets

# Restart orchestrator pods (after adding metrics)
kubectl rollout restart statefulset/backend-orchestrator -n orchestrator
kubectl rollout restart deployment/frontend-orchestrator -n orchestrator

# Get Grafana admin password
kubectl get secret -n monitoring prometheus-stack-grafana -o jsonpath="{.data.admin-password}" | base64 --decode
```

---

## Recommended Dashboards to Import 📚

| Priority | ID | Name | Use Case |
|----------|-----|------|----------|
| ⭐⭐⭐ | 15760 | Kubernetes Views - Global | Cluster overview |
| ⭐⭐⭐ | 15757 | Kubernetes Views - Namespaces | Namespace metrics |
| ⭐⭐⭐ | 1860 | Node Exporter Full | Node health |
| ⭐⭐ | 14981 | Kubernetes Monitoring | Detailed K8s monitoring |
| ⭐⭐ | 13770 | Kubernetes Deployment | Deployment tracking |
| ⭐ | 7249 | Kubernetes Cluster | Alternative cluster view |

---

## Troubleshooting 🔧

### ServiceMonitor not appearing in Prometheus

```bash
# Check if ServiceMonitor has correct labels
kubectl get servicemonitor -n monitoring backend-orchestrator -o yaml

# Verify the label "release: prometheus-stack" is present
# If missing, add it:
kubectl patch servicemonitor backend-orchestrator -n monitoring -p '{"metadata":{"labels":{"release":"prometheus-stack"}}}'
```

### Metrics endpoint not working

```bash
# Check if backend pod has metrics endpoint
kubectl exec -n orchestrator backend-orchestrator-0 -- curl localhost:5000/metrics

# Check backend logs
kubectl logs -n orchestrator backend-orchestrator-0

# Verify service has correct port name
kubectl get svc -n orchestrator backend-orchestrator-service -o yaml
# Port should be named "http"
```

### Grafana not loading dashboards

```bash
# Restart Grafana pod
kubectl rollout restart deployment/prometheus-stack-grafana -n monitoring

# Check Grafana logs
kubectl logs -n monitoring -l app.kubernetes.io/name=grafana
```

---

## Next Steps 🎯

1. ✅ Apply ServiceMonitor for your apps
2. ✅ Add metrics endpoint to backend
3. ✅ Import recommended dashboards
4. ✅ Create custom orchestrator dashboard
5. ✅ Set up alerts for production
6. ✅ Configure notification channels

You're all set! 🚀



