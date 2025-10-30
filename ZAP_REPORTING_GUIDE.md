# 🔒 OWASP ZAP Reporting Guide

## 📊 Three Ways to Get ZAP Reports

---

## Option 1: GitHub Actions Pipeline (Automated)

### **How it works:**
- ZAP scan runs automatically after deployment
- Results shown in GitHub Actions summary
- Text output uploaded as artifact

### **View Results:**

1. Go to: `https://github.com/Cybernasty/Docker_Orchestrator/actions`
2. Click on latest workflow run
3. Scroll to "🔒 OWASP ZAP Security Scan" section
4. View results inline in the summary
5. Download artifact "zap-security-reports" for full output

### **What you get:**
- ✅ Scan results in pipeline summary
- ✅ Downloadable text output
- ✅ Runs on every deployment

---

## Option 2: Manual Scan with Script (Recommended)

### **Run:**

```bash
# Make script executable
chmod +x generate-zap-report.sh

# Run scan (default target)
./generate-zap-report.sh

# Or specify custom target
./generate-zap-report.sh http://192.168.11.143:30080 ./my-reports
```

### **What you get:**
- ✅ Full text output: `zap-reports/zap-scan-output.txt`
- ✅ Markdown summary: `zap-reports/summary.md`
- ✅ Severity counts
- ✅ Easy to review

---

## Option 3: Direct ZAP Scan (Simplest)

### **Quick Scan:**

```bash
# Get ZAP pod
ZAP_POD=$(kubectl get pod -n zap -l app=zap -o jsonpath='{.items[0].metadata.name}')

# Run baseline scan with short output
kubectl exec -n zap $ZAP_POD -- zap-baseline.py \
  -t http://frontend-orchestrator.orchestrator.svc.cluster.local \
  -I -s

# Results printed directly to terminal
```

### **What you get:**
- ✅ Quick results in terminal
- ✅ No file management needed
- ✅ Perfect for quick checks

---

## 📋 Understanding ZAP Output

### **Output Format:**

```
PASS: <test-name> [<url>]           ← Test passed
WARN-NEW: <test-name> [<url>]       ← Warning (informational)
FAIL-NEW: 0 <test-name> [<url>]     ← CRITICAL vulnerability
FAIL-NEW: 1 <test-name> [<url>]     ← HIGH vulnerability
FAIL-NEW: 2 <test-name> [<url>]     ← MEDIUM vulnerability
FAIL-NEW: 3 <test-name> [<url>]     ← LOW vulnerability
```

### **Severity Levels:**

| Code | Severity | Action Required |
|------|----------|-----------------|
| FAIL-NEW: 0 | 🔴 Critical | **Fix immediately** |
| FAIL-NEW: 1 | 🟠 High | Fix before production |
| FAIL-NEW: 2 | 🟡 Medium | Fix in next sprint |
| FAIL-NEW: 3 | 🟢 Low | Fix when possible |
| WARN-NEW | ⚠️ Warning | Review and consider |

---

## 🎯 Common Findings & Fixes

### **1. Missing Security Headers**

**Finding:**
```
WARN-NEW: X-Content-Type-Options Header Missing [http://...]
WARN-NEW: X-Frame-Options Header Not Set [http://...]
```

**Fix in `frontend_orchestrator/nginx.conf`:**
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

### **2. Cookie Without Secure Flag**

**Finding:**
```
FAIL-NEW: 2 Cookie Without Secure Flag [http://...]
```

**Fix in backend:**
```javascript
res.cookie('session', value, {
  secure: true,
  httpOnly: true,
  sameSite: 'strict'
});
```

### **3. CSP Header Not Set**

**Finding:**
```
WARN-NEW: Content Security Policy (CSP) Header Not Set
```

**Fix in nginx.conf:**
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
```

---

## 📊 Generate Custom HTML Report

### **Using Parse Script:**

```bash
# Run scan and save output
ZAP_POD=$(kubectl get pod -n zap -l app=zap -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n zap $ZAP_POD -- zap-baseline.py \
  -t http://frontend-orchestrator.orchestrator.svc.cluster.local \
  -I -s > zap-output.txt

# Parse and create HTML report
python3 parse-zap-output.py zap-output.txt zap-custom-report.html

# Open report
firefox zap-custom-report.html
```

---

## 🔄 Regular Scanning Schedule

### **Weekly Scans:**

Add to crontab:
```bash
# Run ZAP scan every Sunday at 2 AM
0 2 * * 0 /path/to/generate-zap-report.sh
```

### **Pre-Release Scans:**

Before major deployments:
```bash
# Run comprehensive scan
./generate-zap-report.sh http://192.168.11.143:30080 ./release-scan

# Review findings
cat ./release-scan/summary.md

# Fix issues before deploying
```

---

## 📈 Track Security Over Time

### **Save Reports with Dates:**

```bash
# Create dated report directory
DATE=$(date +%Y-%m-%d)
mkdir -p security-reports/$DATE

# Run scan
./generate-zap-report.sh http://192.168.11.143:30080 security-reports/$DATE

# Compare with previous
diff security-reports/2025-10-29/summary.md security-reports/$DATE/summary.md
```

---

## ✅ Best Practices

1. **Run scans regularly** (at least weekly)
2. **Fix critical/high issues** before deploying
3. **Track trends** over time
4. **Document fixes** in Git commits
5. **Re-scan after fixes** to verify
6. **Include in security audits**

---

## 🚀 Quick Reference

```bash
# Quick scan (terminal output)
kubectl exec -n zap $(kubectl get pod -n zap -l app=zap -o jsonpath='{.items[0].metadata.name}') -- \
  zap-baseline.py -t http://frontend-orchestrator.orchestrator.svc.cluster.local -I -s

# Full scan with script
./generate-zap-report.sh

# View in pipeline
# Go to GitHub Actions → Latest run → Summary
```

---

**Choose the method that works best for your workflow!** 🔒

