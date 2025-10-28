# 🔒 OWASP ZAP Security Testing Guide

## 🎯 Quick Start

OWASP ZAP (Zed Attack Proxy) is a web application security scanner that helps find vulnerabilities in your orchestrator application.

---

## 🚀 Deploy OWASP ZAP

### **Step 1: Create ZAP Namespace**

```bash
kubectl create namespace zap
```

### **Step 2: Deploy ZAP**

```bash
# Deploy ZAP with working configuration
kubectl apply -f k8s/zap-working.yaml

# Deploy NodePort service for easy access
kubectl apply -f k8s/zap-nodeport.yaml

# Verify it's running
kubectl get pods -n zap
```

**Wait for pod to be ready:**
```bash
kubectl wait --for=condition=Ready pod -l app=zap -n zap --timeout=300s
```

### **Step 3: Access ZAP**

ZAP is available at:
- **NodePort**: `http://192.168.11.143:30808`
- **Service**: `http://zap-service.zap.svc.cluster.local:8080` (internal)

---

## 🔍 Scan Your Orchestrator Application

### **Option 1: Quick Scan via ZAP API**

```bash
# Get your orchestrator URL
ORCHESTRATOR_URL="http://192.168.11.143:30080"
ZAP_URL="http://192.168.11.143:30808"

# Start a spider scan
curl "$ZAP_URL/JSON/spider/action/scan/?url=$ORCHESTRATOR_URL"

# Wait for spider to complete (check progress)
curl "$ZAP_URL/JSON/spider/view/status"

# Start active scan
curl "$ZAP_URL/JSON/ascan/action/scan/?url=$ORCHESTRATOR_URL"

# Check scan progress
curl "$ZAP_URL/JSON/ascan/view/status"

# Get scan results
curl "$ZAP_URL/JSON/core/view/alerts" > zap-results.json
```

### **Option 2: Baseline Scan (Automated)**

```bash
# Run from within ZAP pod
kubectl exec -n zap <zap-pod-name> -- zap-baseline.py -t http://frontend-orchestrator.orchestrator.svc.cluster.local

# Or scan external URL
kubectl exec -n zap <zap-pod-name> -- zap-baseline.py -t http://192.168.11.143:30080 -r zap-baseline-report.html
```

### **Option 3: Full Scan (Comprehensive)**

```bash
# Run full scan
kubectl exec -n zap <zap-pod-name> -- zap-full-scan.py -t http://frontend-orchestrator.orchestrator.svc.cluster.local -r zap-full-report.html
```

---

## 📊 Using ZAP API

### **Check ZAP is Running:**

```bash
curl http://192.168.11.143:30808/JSON/core/view/version
```

### **Common API Commands:**

```bash
ZAP_API="http://192.168.11.143:30808"
TARGET="http://192.168.11.143:30080"

# 1. Start spider scan (crawl the site)
curl "$ZAP_API/JSON/spider/action/scan/?url=$TARGET&maxChildren=10"

# 2. Check spider progress (wait until 100)
while true; do
  PROGRESS=$(curl -s "$ZAP_API/JSON/spider/view/status" | grep -o '[0-9]\+')
  echo "Spider progress: $PROGRESS%"
  [ "$PROGRESS" = "100" ] && break
  sleep 5
done

# 3. Start active scan (test for vulnerabilities)
SCAN_ID=$(curl -s "$ZAP_API/JSON/ascan/action/scan/?url=$TARGET" | grep -o '[0-9]\+')
echo "Active scan started with ID: $SCAN_ID"

# 4. Monitor active scan progress
while true; do
  PROGRESS=$(curl -s "$ZAP_API/JSON/ascan/view/status/?scanId=$SCAN_ID" | grep -o '[0-9]\+')
  echo "Active scan progress: $PROGRESS%"
  [ "$PROGRESS" = "100" ] && break
  sleep 10
done

# 5. Get results
curl "$ZAP_API/JSON/core/view/alerts" | jq '.' > zap-scan-results.json

# 6. Generate HTML report
curl "$ZAP_API/OTHER/core/other/htmlreport" > zap-report.html

# 7. Get summary
curl "$ZAP_API/JSON/core/view/alertsSummary" | jq '.'
```

---

## 🎯 Automated Scan Script

Create `run-zap-scan.sh`:

```bash
#!/bin/bash

ZAP_API="http://192.168.11.143:30808"
TARGET="http://192.168.11.143:30080"

echo "🔒 Starting OWASP ZAP Security Scan"
echo "Target: $TARGET"
echo ""

# Start spider
echo "🕷️ Step 1: Spidering application..."
curl -s "$ZAP_API/JSON/spider/action/scan/?url=$TARGET&maxChildren=20" > /dev/null

# Wait for spider
while true; do
  PROGRESS=$(curl -s "$ZAP_API/JSON/spider/view/status" | grep -o '[0-9]\+' | head -1)
  echo -ne "Spider progress: $PROGRESS%\r"
  [ "$PROGRESS" = "100" ] && break
  sleep 3
done
echo ""
echo "✅ Spider complete"

# Start active scan
echo "🔍 Step 2: Active vulnerability scanning..."
SCAN_ID=$(curl -s "$ZAP_API/JSON/ascan/action/scan/?url=$TARGET" | grep -o '[0-9]\+' | head -1)

# Wait for active scan
while true; do
  PROGRESS=$(curl -s "$ZAP_API/JSON/ascan/view/status/?scanId=$SCAN_ID" | grep -o '[0-9]\+' | head -1)
  echo -ne "Active scan progress: $PROGRESS%\r"
  [ "$PROGRESS" = "100" ] && break
  sleep 5
done
echo ""
echo "✅ Active scan complete"

# Get results
echo "📊 Step 3: Generating reports..."
curl -s "$ZAP_API/JSON/core/view/alerts" | jq '.' > zap-alerts.json
curl -s "$ZAP_API/OTHER/core/other/htmlreport" > zap-report.html
curl -s "$ZAP_API/JSON/core/view/alertsSummary" | jq '.' > zap-summary.json

echo "✅ Reports generated:"
echo "  - zap-alerts.json (detailed alerts)"
echo "  - zap-report.html (HTML report)"
echo "  - zap-summary.json (summary)"

# Show summary
echo ""
echo "📋 Vulnerability Summary:"
curl -s "$ZAP_API/JSON/core/view/alertsSummary" | jq -r '.alertsSummary | to_entries[] | "\(.key): \(.value)"'

echo ""
echo "🎉 Scan complete!"
```

Make it executable:
```bash
chmod +x run-zap-scan.sh
./run-zap-scan.sh
```

---

## 🔍 What to Scan

### **Your Application Endpoints:**

1. **Frontend**: `http://192.168.11.143:30080`
2. **Backend API**: `http://192.168.11.143:30050/api`
3. **Specific endpoints**:
   - Login: `http://192.168.11.143:30080/login`
   - Dashboard: `http://192.168.11.143:30080/home`
   - Containers: `http://192.168.11.143:30080/containers`

---

## 📊 View Results

### **Via API:**
```bash
# Get all alerts
curl http://192.168.11.143:30808/JSON/core/view/alerts | jq '.alerts[] | {risk: .risk, name: .name, url: .url}'

# Get high/critical issues only
curl http://192.168.11.143:30808/JSON/core/view/alerts | jq '.alerts[] | select(.risk=="High" or .risk=="Critical")'

# Get alert count by severity
curl http://192.168.11.143:30808/JSON/core/view/alertsSummary | jq '.'
```

### **HTML Report:**
```bash
# Generate and download HTML report
curl http://192.168.11.143:30808/OTHER/core/other/htmlreport > owasp-zap-report.html

# Open in browser
firefox owasp-zap-report.html
```

---

## 🧹 Clean Up After Scan

```bash
# Delete all sessions and alerts
curl "http://192.168.11.143:30808/JSON/core/action/deleteAllAlerts"

# Create new session
curl "http://192.168.11.143:30808/JSON/core/action/newSession/?name=orchestrator-scan"
```

---

## 🔄 Restart ZAP

```bash
# Restart ZAP deployment
kubectl rollout restart deployment/zap -n zap

# Check status
kubectl rollout status deployment/zap -n zap

# View logs
kubectl logs -n zap -l app=zap -f
```

---

## 🗑️ Uninstall ZAP

```bash
kubectl delete -f k8s/zap-working.yaml
kubectl delete -f k8s/zap-nodeport.yaml
kubectl delete namespace zap
```

---

## 🎯 Quick Commands Summary

```bash
# Deploy ZAP
kubectl create namespace zap
kubectl apply -f k8s/zap-working.yaml
kubectl apply -f k8s/zap-nodeport.yaml

# Access ZAP
echo "ZAP URL: http://192.168.11.143:30808"

# Quick scan
curl "http://192.168.11.143:30808/JSON/spider/action/scan/?url=http://192.168.11.143:30080"

# Get results
curl "http://192.168.11.143:30808/JSON/core/view/alerts" | jq '.alerts[] | {risk, name, url}'

# Generate report
curl "http://192.168.11.143:30808/OTHER/core/other/htmlreport" > zap-report.html
```

---

## ✅ Expected Results

After scanning, ZAP will find issues like:
- 🔴 **High**: SQL Injection, XSS, CSRF
- 🟡 **Medium**: Missing security headers
- 🟢 **Low**: Information disclosure
- 🔵 **Info**: Server version disclosure

Review and fix these issues to improve your application security!

---

**Ready to deploy ZAP?** Run the commands above! 🚀
