# HashiCorp Vault - Quick Start Guide

## 🚀 **5-Minute Setup**

### **Prerequisites**
- ✅ Kubernetes cluster running
- ✅ kubectl configured
- ✅ Backend application deployed

---

## 📋 **Quick Deployment Steps**

### **1. Deploy Vault (Automated)**

```bash
# Windows
deploy-vault.bat

# Linux/Mac
chmod +x deploy-vault.sh
./deploy-vault.sh
```

This script automatically:
- ✅ Creates vault namespace
- ✅ Deploys Vault
- ✅ Initializes Vault
- ✅ Unseals Vault
- ✅ Configures KV secrets engine
- ✅ Sets up AppRole authentication
- ✅ Creates policies
- ✅ Stores sample secrets
- ✅ Creates Kubernetes secrets for backend

**⚠️ Important**: Save the `vault-keys.txt` file securely!

---

### **2. Access Vault UI**

```bash
# Port forward
kubectl port-forward -n vault svc/vault-ui 8200:8200

# Open browser
http://localhost:8200

# Login with root token from vault-keys.txt
```

---

### **3. Update Backend to Use Vault**

#### **Add Vault dependency**

```bash
cd backend_orchestrator
npm install node-vault
```

#### **Update .env**

```env
# Enable Vault
USE_VAULT=true

# Vault configuration
VAULT_ADDR=http://vault.vault.svc.cluster.local:8200
# Role ID and Secret ID will come from Kubernetes secret
```

#### **Update config.js**

Add import at the top:
```javascript
import vaultService from "../services/vaultService.js";
```

Add initialization function (see VAULT_INTEGRATION_GUIDE.md for complete code)

---

### **4. Deploy Backend with Vault Integration**

Update `k8s/backend-deployment.yaml` - add environment variables:

```yaml
env:
- name: USE_VAULT
  value: "true"
- name: VAULT_ADDR
  value: "http://vault.vault.svc.cluster.local:8200"
- name: VAULT_ROLE_ID
  valueFrom:
    secretKeyRef:
      name: vault-auth
      key: role-id
- name: VAULT_SECRET_ID
  valueFrom:
    secretKeyRef:
      name: vault-auth
      key: secret-id
```

Apply:
```bash
kubectl apply -f k8s/backend-deployment.yaml
```

---

### **5. Verify Integration**

```bash
# Check backend logs
kubectl logs -n default -l app=backend -f

# Should see:
# 🔐 Loading secrets from Vault...
# ✅ Vault client initialized and authenticated
# ✅ Secrets loaded from Vault successfully
```

---

## 🧪 **Test Locally**

### **Run Vault in Dev Mode**

```bash
docker run -d --name vault-dev -p 8200:8200 \
  -e 'VAULT_DEV_ROOT_TOKEN_ID=myroot' \
  -e 'VAULT_DEV_LISTEN_ADDRESS=0.0.0.0:8200' \
  hashicorp/vault:latest
```

### **Configure Vault**

```bash
# Set environment
set VAULT_ADDR=http://localhost:8200
set VAULT_TOKEN=myroot

# Store secrets (using vault CLI or Docker exec)
docker exec vault-dev vault kv put orchestrator/jwt secret="local-test-secret" expires_in="24h"
docker exec vault-dev vault kv put orchestrator/mongodb uri="mongodb://localhost:27017/containersDB"
docker exec vault-dev vault kv put orchestrator/docker registry="localhost:6500"
docker exec vault-dev vault kv put orchestrator/app cors_origin="http://localhost:3000" node_env="development" port="5000"
```

### **Test Integration**

```bash
node test-vault-integration.js
```

---

## 📊 **Secrets Organization**

```
orchestrator/
├── jwt
│   ├── secret
│   └── expires_in
├── mongodb
│   ├── uri
│   ├── username
│   └── password
├── docker
│   ├── registry
│   ├── username
│   └── password
└── app
    ├── cors_origin
    ├── node_env
    └── port
```

---

## 🔧 **Common Operations**

### **Update a Secret**

```bash
# Get pod name
export VAULT_POD=$(kubectl get pod -n vault -l app=vault -o jsonpath='{.items[0].metadata.name}')

# Update JWT secret
kubectl exec -n vault $VAULT_POD -- vault kv put orchestrator/jwt \
  secret="new-super-secret-key" \
  expires_in="24h"

# Restart backend to pick up new secret
kubectl rollout restart deployment/backend -n default
```

### **Read a Secret**

```bash
kubectl exec -n vault $VAULT_POD -- vault kv get orchestrator/jwt
```

### **List All Secrets**

```bash
kubectl exec -n vault $VAULT_POD -- vault kv list orchestrator/
```

---

## 🎯 **Files Created**

| File | Purpose |
|------|---------|
| `k8s/vault-config.yaml` | Vault ConfigMap with configuration |
| `k8s/vault-deployment.yaml` | Vault Deployment, Service, PVC |
| `backend_orchestrator/services/vaultService.js` | Vault client service |
| `deploy-vault.sh` / `.bat` | Automated deployment script |
| `test-vault-integration.js` | Test Vault connectivity |
| `VAULT_INTEGRATION_GUIDE.md` | Comprehensive guide |
| `VAULT_QUICKSTART.md` | This quick start guide |

---

## ✅ **Integration Checklist**

### **Vault Setup**
- [ ] Vault deployed to Kubernetes
- [ ] Vault initialized
- [ ] Vault unsealed
- [ ] Unseal keys saved securely
- [ ] Root token saved
- [ ] KV secrets engine enabled
- [ ] AppRole authentication enabled
- [ ] Application policy created
- [ ] AppRole created with policy
- [ ] Role ID and Secret ID obtained

### **Backend Integration**
- [ ] `node-vault` package installed
- [ ] `vaultService.js` created
- [ ] `config.js` updated to use Vault
- [ ] `server.js` updated to initialize Vault
- [ ] `.env` updated with Vault settings
- [ ] Backend deployment updated with Vault env vars
- [ ] Kubernetes secret created for Vault auth

### **Testing**
- [ ] Vault UI accessible
- [ ] Secrets visible in Vault UI
- [ ] Backend successfully connects to Vault
- [ ] Secrets retrieved correctly
- [ ] Application starts without errors
- [ ] Token renewal working

---

## 🚨 **Security Reminders**

⚠️ **CRITICAL - After Deployment:**

1. **Secure vault-keys.txt**
   - Store in password manager
   - Split unseal keys among team members
   - Never commit to Git

2. **Rotate Root Token**
   ```bash
   vault token create -policy=root
   vault token revoke <old-root-token>
   ```

3. **Enable Audit Logging**
   ```bash
   vault audit enable file file_path=/vault/logs/audit.log
   ```

4. **Regular Backups**
   - Schedule weekly backups of `/vault/data`
   - Test restore procedures

5. **Use TLS in Production**
   - Update vault config to use TLS
   - Provide SSL certificates

---

## 📞 **Need Help?**

Check the comprehensive guide:
```bash
# View full guide
cat VAULT_INTEGRATION_GUIDE.md
```

**Common Issues:**
- Vault sealed → Unseal with 3 keys
- Connection refused → Check Vault is running
- Auth failed → Verify Role ID and Secret ID
- Secrets not found → Check secret path is correct

---

**Happy Vaulting! 🔐**

