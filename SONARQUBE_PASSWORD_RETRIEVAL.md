# SonarQube Password Retrieval Guide

## Method 1: Check Kubernetes Secrets 🔐

```bash
# List all secrets in sonarqube namespace
kubectl get secrets -n sonarqube

# Check for sonarqube-related secrets
kubectl get secret -n sonarqube -o yaml | grep -i password

# If there's a secret named 'sonarqube' or 'sonarqube-admin'
kubectl get secret sonarqube -n sonarqube -o jsonpath='{.data.SONAR_ADMIN_PASSWORD}' | base64 --decode
echo
```

---

## Method 2: Check Environment Variables 🔍

```bash
# Check pod environment variables
kubectl describe pod -n sonarqube sonarqube-5694d5c9c9-lkt2r | grep -i password

# Check deployment environment
kubectl get deployment -n sonarqube sonarqube -o yaml | grep -i password
```

---

## Method 3: Default Credentials (Most Common) 🎯

**SonarQube default credentials:**
- **Username**: `admin`
- **Password**: `admin`

Try accessing SonarQube with these default credentials first.

---

## Method 4: Access SonarQube and Reset Password 🔄

### A. Port Forward to SonarQube

```bash
# Port forward to access SonarQube UI
kubectl port-forward -n sonarqube svc/sonarqube 9000:9000

# Open browser: http://localhost:9000
# Username: admin
# Password: admin (default)
```

### B. If Default Password Doesn't Work

```bash
# Check SonarQube service
kubectl get svc -n sonarqube

# If it has a NodePort, access it via:
# http://<node-ip>:<nodeport>
```

### C. Reset Admin Password from Pod

```bash
# Get a shell into the SonarQube pod
kubectl exec -it -n sonarqube sonarqube-5694d5c9c9-lkt2r -- /bin/bash

# Inside the pod, check SonarQube admin user
# SonarQube stores credentials in its database (PostgreSQL/H2)
# You'll need to reset through the UI or database directly
```

---

## Method 5: Reset Password via Database 💾

### If SonarQube uses PostgreSQL:

```bash
# Find PostgreSQL pod (if deployed)
kubectl get pods -n sonarqube | grep postgres

# Connect to PostgreSQL
kubectl exec -it -n sonarqube <postgres-pod-name> -- psql -U sonarqube

# In PostgreSQL shell, reset admin password
UPDATE users SET crypted_password = '$2a$12$uCkkXmhW5ThVK8mpBvnXOOJRLd64LJeHTeCkSuB3lfaR2N0AYBaSi', salt=null WHERE login = 'admin';

# Exit PostgreSQL
\q

# The password is now reset to: admin
```

### If SonarQube uses embedded H2 database:

```bash
# You'll need to stop SonarQube and use H2 console
# This is more complex and usually requires manual intervention
```

---

## Method 6: Check ConfigMap or Deployment YAML 📄

```bash
# Check if password is in ConfigMap
kubectl get configmap -n sonarqube
kubectl get configmap -n sonarqube <configmap-name> -o yaml

# Check deployment for password hints
kubectl get deployment -n sonarqube sonarqube -o yaml
```

---

## Quick Access Command 🚀

```bash
# Port forward to SonarQube
kubectl port-forward -n sonarqube svc/sonarqube 9000:9000

# Open browser: http://localhost:9000
# Try default credentials:
#   Username: admin
#   Password: admin
```

---

## If You Need to Change Password After Login 🔧

1. Login with current credentials
2. Go to **Administration** → **Security** → **Users**
3. Find the **admin** user
4. Click **Change Password**
5. Set a new password

---

## Common Issues & Solutions ⚠️

### Issue 1: "admin/admin" doesn't work

**Solution**: Check if password was changed during initial setup
```bash
# Check pod logs for password
kubectl logs -n sonarqube sonarqube-5694d5c9c9-lkt2r | grep -i password

# Look for lines like:
# "Default admin credentials should be changed"
```

### Issue 2: Can't access SonarQube UI

**Solution**: Check service type
```bash
kubectl get svc -n sonarqube sonarqube

# If ClusterIP, use port-forward:
kubectl port-forward -n sonarqube svc/sonarqube 9000:9000

# If NodePort, use:
# http://<node-ip>:<nodeport>
```

### Issue 3: Need to reset password but can't login

**Solution**: Delete and recreate admin user via database (PostgreSQL method above)

---

## Best Practice: Store Password in Secret 🔒

After you retrieve/reset the password, store it properly:

```bash
# Create a secret for SonarQube admin password
kubectl create secret generic sonarqube-admin-credentials \
  -n sonarqube \
  --from-literal=username=admin \
  --from-literal=password=<your-secure-password>

# Retrieve it later
kubectl get secret sonarqube-admin-credentials -n sonarqube -o jsonpath='{.data.password}' | base64 --decode
```

---

## Next Steps 🎯

1. ✅ Try default credentials (admin/admin)
2. ✅ If that doesn't work, check secrets in namespace
3. ✅ Reset password via database if needed
4. ✅ Store password securely in Kubernetes secret
5. ✅ Update SonarQube configuration with new credentials



