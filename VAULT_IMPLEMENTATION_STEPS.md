# HashiCorp Vault - Complete Implementation Steps

## 🎯 **Overview**

This guide provides the exact steps to integrate HashiCorp Vault into your Docker Orchestrator platform for secure secret management.

---

## 📦 **What You Get**

✅ Centralized secret management  
✅ Encrypted secret storage  
✅ Automatic secret rotation  
✅ Access control and audit logging  
✅ Dynamic credentials  
✅ Kubernetes integration  

---

## 🚀 **Implementation Path**

### **Path A: Kubernetes Deployment (Production)**
### **Path B: Local Development (Testing)**

Choose your path based on your current need.

---

# PATH A: Kubernetes Deployment

## 📋 **Step-by-Step (Kubernetes)**

### **Step 1: Deploy Vault**

```bash
# Option 1: Automated (Recommended)
# Windows:
deploy-vault.bat

# Linux/Mac:
chmod +x deploy-vault.sh
./deploy-vault.sh

# Option 2: Manual
kubectl apply -f k8s/vault-config.yaml
kubectl apply -f k8s/vault-deployment.yaml
```

**Expected Output:**
```
✅ Namespace created
✅ Vault deployment applied
✅ Vault pod is ready
✅ Vault initialized
✅ Vault unsealed
✅ Keys saved to vault-keys.txt
```

⚠️ **CRITICAL**: Secure `vault-keys.txt` - it contains unseal keys and root token!

---

### **Step 2: Verify Vault is Running**

```bash
# Check pod status
kubectl get pods -n vault

# Should show:
# NAME                     READY   STATUS    RESTARTS   AGE
# vault-xxxxxxxxxx-xxxxx   1/1     Running   0          2m

# Check Vault status
export VAULT_POD=$(kubectl get pod -n vault -l app=vault -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n vault $VAULT_POD -- vault status
```

---

### **Step 3: Store Your Production Secrets**

```bash
# Get pod name
export VAULT_POD=$(kubectl get pod -n vault -l app=vault -o jsonpath='{.items[0].metadata.name}')

# Login (use root token from vault-keys.txt)
kubectl exec -n vault $VAULT_POD -- vault login <your-root-token>

# Store JWT secret
kubectl exec -n vault $VAULT_POD -- vault kv put orchestrator/jwt \
  secret="$(openssl rand -base64 32)" \
  expires_in="24h"

# Store MongoDB credentials  
kubectl exec -n vault $VAULT_POD -- vault kv put orchestrator/mongodb \
  uri="mongodb://mongo-0.mongo-service.default.svc.cluster.local:27017,mongo-1.mongo-service.default.svc.cluster.local:27017,mongo-2.mongo-service.default.svc.cluster.local:27017/containersDB?replicaSet=rs0" \
  username="admin" \
  password="your-mongodb-password"

# Store Docker registry credentials
kubectl exec -n vault $VAULT_POD -- vault kv put orchestrator/docker \
  registry="localhost:6500" \
  username="admin" \
  password="your-registry-password"

# Store app configuration
kubectl exec -n vault $VAULT_POD -- vault kv put orchestrator/app \
  cors_origin="*" \
  node_env="production" \
  port="5000"
```

---

### **Step 4: Install Vault Client in Backend**

```bash
cd backend_orchestrator
npm install node-vault
```

The `vaultService.js` file is already created at `backend_orchestrator/services/vaultService.js` ✅

---

### **Step 5: Update Backend Configuration**

#### **Update `backend_orchestrator/config/config.js`**

Add at the top:
```javascript
import vaultService from "../services/vaultService.js";
```

Replace the config object with:
```javascript
const USE_VAULT = process.env.USE_VAULT === 'true';

let config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  
  // Will be populated from Vault or .env
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  dockerSocket: process.env.DOCKER_SOCKET || "/var/run/docker.sock",
  dockerHost: process.env.DOCKER_HOST || null,
  
  vault: {
    enabled: USE_VAULT,
    addr: process.env.VAULT_ADDR || 'http://vault.vault.svc.cluster.local:8200',
    roleId: process.env.VAULT_ROLE_ID,
    secretId: process.env.VAULT_SECRET_ID
  }
};

// Initialize secrets from Vault
export async function initializeConfig() {
  if (config.vault.enabled) {
    console.log('🔐 Loading secrets from Vault...');
    
    try {
      await vaultService.initialize();
      const secrets = await vaultService.getAllSecrets();
      
      // Override config with Vault secrets
      config.jwtSecret = secrets.jwt.secret;
      config.jwtExpiresIn = secrets.jwt.expires_in || '24h';
      config.mongoUri = secrets.mongodb.uri;
      config.corsOrigin = secrets.app.cors_origin;
      
      console.log('✅ Secrets loaded from Vault successfully');
    } catch (error) {
      console.error('❌ Failed to load secrets from Vault:', error.message);
      console.log('⚠️  Falling back to environment variables');
    }
  }
  
  return config;
}

export default config;
```

---

### **Step 6: Update server.js**

Find the server initialization code and wrap it:

```javascript
import { initializeConfig } from "./config/config.js";

async function startServer() {
  try {
    // Initialize configuration (load from Vault if enabled)
    const config = await initializeConfig();
    
    // Connect to database
    await connectDB();
    
    // ... rest of your server setup ...
    
    // Start server
    server.listen(config.port, () => {
      console.log(`🚀 Server is running on port ${config.port}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

---

### **Step 7: Update Backend Deployment**

Edit `k8s/backend-deployment.yaml` and add Vault environment variables:

```yaml
spec:
  template:
    spec:
      containers:
      - name: backend
        env:
        # Existing environment variables...
        
        # Add Vault configuration
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

---

### **Step 8: Deploy Updated Backend**

```bash
# Apply updated deployment
kubectl apply -f k8s/backend-deployment.yaml

# Watch rollout
kubectl rollout status deployment/backend -n default

# Check logs
kubectl logs -n default -l app=backend -f
```

**Expected logs:**
```
🔐 Loading secrets from Vault...
✅ Vault client initialized and authenticated
✅ Vault authenticated successfully
✅ Secrets loaded from Vault successfully
🔗 Connected to MongoDB
🚀 Server is running on port 5000
```

---

### **Step 9: Test Integration**

```bash
# Test from outside cluster
kubectl port-forward -n default svc/backend-service 5000:5000

# Test API
curl http://localhost:5000/api/containers \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

# PATH B: Local Development

## 📋 **Step-by-Step (Local)**

### **Step 1: Run Vault in Dev Mode**

```bash
# Start Vault container
docker run -d --name vault-dev -p 8200:8200 \
  -e 'VAULT_DEV_ROOT_TOKEN_ID=myroot' \
  -e 'VAULT_DEV_LISTEN_ADDRESS=0.0.0.0:8200' \
  hashicorp/vault:latest

# Verify it's running
docker ps | findstr vault
```

---

### **Step 2: Configure Vault**

```bash
# Enable KV engine
docker exec vault-dev vault secrets enable -version=2 -path=orchestrator kv

# Store secrets
docker exec vault-dev vault kv put orchestrator/jwt \
  secret="local-development-secret-key" \
  expires_in="24h"

docker exec vault-dev vault kv put orchestrator/mongodb \
  uri="mongodb://localhost:27017/containersDB"

docker exec vault-dev vault kv put orchestrator/docker \
  registry="localhost:6500"

docker exec vault-dev vault kv put orchestrator/app \
  cors_origin="http://localhost:3000" \
  node_env="development" \
  port="5000"
```

---

### **Step 3: Enable AppRole**

```bash
# Enable AppRole
docker exec vault-dev vault auth enable approle

# Create policy
docker exec vault-dev sh -c 'cat > /tmp/policy.hcl << EOF
path "orchestrator/*" {
  capabilities = ["read", "list"]
}
path "orchestrator/data/*" {
  capabilities = ["read", "list"]
}
EOF'

docker exec vault-dev vault policy write orchestrator-policy /tmp/policy.hcl

# Create role
docker exec vault-dev vault write auth/approle/role/orchestrator-backend \
  token_policies="orchestrator-policy" \
  token_ttl=1h \
  token_max_ttl=4h

# Get credentials
docker exec vault-dev vault read auth/approle/role/orchestrator-backend/role-id
docker exec vault-dev vault write -f auth/approle/role/orchestrator-backend/secret-id
```

---

### **Step 4: Update Local .env**

```env
# Enable Vault
USE_VAULT=true

# Vault configuration (local)
VAULT_ADDR=http://localhost:8200
VAULT_ROLE_ID=<role-id-from-previous-step>
VAULT_SECRET_ID=<secret-id-from-previous-step>

# Fallback values (in case Vault is down)
JWT_SECRET=fallback-local-secret
MONGO_URI=mongodb://localhost:27017/containersDB
CORS_ORIGIN=http://localhost:3000
```

---

### **Step 5: Install Dependencies**

```bash
cd backend_orchestrator
npm install
```

This will install `node-vault` (already added to package.json) ✅

---

### **Step 6: Test Vault Connection**

```bash
# From project root
node test-vault-integration.js
```

**Expected Output:**
```
🧪 Testing Vault Integration
============================================================
📝 Checking configuration...
   VAULT_ADDR: http://localhost:8200
   VAULT_ROLE_ID: ***xxxx
   VAULT_SECRET_ID: ***xxxx

🔐 Initializing Vault client...
✅ Vault initialized

📥 Retrieving secrets from Vault...
✅ JWT Config:
   Secret: local-development-s...
   Expires In: 24h

✅ MongoDB Config:
   URI: mongodb://localhost:27017/containersDB

🎉 Vault integration test completed successfully!
```

---

### **Step 7: Start Backend with Vault**

```bash
cd backend_orchestrator
npm run dev
```

**Expected Output:**
```
🔐 Loading secrets from Vault...
✅ Vault client initialized and authenticated
✅ Vault authenticated successfully
✅ Secrets loaded from Vault successfully
🔗 Connected to MongoDB
🚀 Server is running on port 5000
```

---

## 🔄 **Switching Between Vault and .env**

### **Use Vault**
```env
USE_VAULT=true
VAULT_ADDR=http://localhost:8200
VAULT_ROLE_ID=xxx
VAULT_SECRET_ID=xxx
```

### **Use .env (Fallback)**
```env
USE_VAULT=false
JWT_SECRET=your-secret
MONGO_URI=mongodb://localhost:27017/containersDB
```

---

## 🧪 **Testing Checklist**

- [ ] Vault container running
- [ ] Vault UI accessible at http://localhost:8200
- [ ] Secrets stored in Vault
- [ ] AppRole configured
- [ ] Role ID and Secret ID obtained
- [ ] backend/package.json includes node-vault
- [ ] vaultService.js created
- [ ] config.js updated
- [ ] .env updated with Vault settings
- [ ] test-vault-integration.js passes
- [ ] Backend starts successfully
- [ ] Backend retrieves secrets from Vault
- [ ] API endpoints work correctly

---

## 📊 **Summary of Created Files**

| File | Purpose |
|------|---------|
| `k8s/vault-config.yaml` | Vault namespace & ConfigMap |
| `k8s/vault-deployment.yaml` | Vault Deployment, Service, PVC |
| `backend_orchestrator/services/vaultService.js` | Vault client service (✅ Created) |
| `deploy-vault.sh` | Automated deployment (Linux/Mac) |
| `deploy-vault.bat` | Automated deployment (Windows) |
| `test-vault-integration.js` | Test Vault connectivity |
| `VAULT_INTEGRATION_GUIDE.md` | Complete guide (all details) |
| `VAULT_QUICKSTART.md` | Quick reference |
| `VAULT_IMPLEMENTATION_STEPS.md` | This file - step by step |

---

## 🎯 **Next Steps Based on Your Environment**

### **If Working on Kubernetes:**
1. Run `deploy-vault.bat` (Windows) or `./deploy-vault.sh` (Linux/Mac)
2. Secure the `vault-keys.txt` file
3. Update production secrets in Vault
4. Update backend deployment YAML
5. Deploy updated backend
6. Verify in logs that secrets are loaded from Vault

### **If Testing Locally:**
1. Run Vault in dev mode: `docker run -d -p 8200:8200 -e VAULT_DEV_ROOT_TOKEN_ID=myroot hashicorp/vault`
2. Configure Vault with secrets
3. Update `.env` with Vault settings
4. Run `node test-vault-integration.js`
5. Start backend: `npm run dev`
6. Verify secrets loaded from Vault

---

## 🔐 **Secret Migration Plan**

### **Current State (Using .env)**
```
backend_orchestrator/.env:
- JWT_SECRET
- MONGO_URI
- CORS_ORIGIN
- DOCKER_SOCKET
```

### **Future State (Using Vault)**
```
Vault (orchestrator/):
- jwt/secret
- jwt/expires_in
- mongodb/uri
- mongodb/username
- mongodb/password
- docker/registry
- docker/username
- docker/password
- app/cors_origin
- app/node_env
- app/port
```

---

## 🛡️ **Security Improvements**

### **Before Vault:**
❌ Secrets in plain text .env files  
❌ Secrets in Git (if accidentally committed)  
❌ Manual secret rotation  
❌ No audit trail  
❌ Secrets in Kubernetes ConfigMaps  

### **After Vault:**
✅ Encrypted secret storage  
✅ Centralized secret management  
✅ Automatic secret rotation  
✅ Full audit logging  
✅ Access control policies  
✅ Dynamic credentials  

---

## 📞 **Troubleshooting**

### **Issue: Vault pod not starting**
```bash
kubectl describe pod -n vault -l app=vault
kubectl logs -n vault -l app=vault
```

### **Issue: Vault is sealed**
```bash
# Unseal with 3 keys from vault-keys.txt
kubectl exec -n vault $VAULT_POD -- vault operator unseal <key1>
kubectl exec -n vault $VAULT_POD -- vault operator unseal <key2>
kubectl exec -n vault $VAULT_POD -- vault operator unseal <key3>
```

### **Issue: Backend can't connect to Vault**
```bash
# Check Vault service
kubectl get svc -n vault

# Check backend environment variables
kubectl describe pod -n default -l app=backend

# Check vault-auth secret exists
kubectl get secret vault-auth -n default
```

### **Issue: Authentication failed**
```bash
# Verify Role ID and Secret ID
kubectl get secret vault-auth -n default -o yaml

# Generate new Secret ID if needed
kubectl exec -n vault $VAULT_POD -- vault write -f auth/approle/role/orchestrator-backend/secret-id
```

---

## ✅ **Final Validation**

Run this checklist to ensure everything is working:

```bash
# 1. Vault is running and unsealed
kubectl exec -n vault $VAULT_POD -- vault status

# 2. Secrets exist
kubectl exec -n vault $VAULT_POD -- vault kv list orchestrator/

# 3. Backend pod is running
kubectl get pods -n default -l app=backend

# 4. Backend logs show Vault connection
kubectl logs -n default -l app=backend | grep Vault

# Expected:
# 🔐 Loading secrets from Vault...
# ✅ Vault client initialized and authenticated
# ✅ Secrets loaded from Vault successfully

# 5. API works
curl http://your-api-endpoint/api/containers -H "Authorization: Bearer <token>"
```

---

## 🎉 **Success Indicators**

You've successfully integrated Vault when:

✅ Vault pod is running and unsealed  
✅ Secrets are stored in Vault  
✅ Backend connects to Vault on startup  
✅ Backend retrieves secrets from Vault  
✅ Application functions normally  
✅ No sensitive data in .env file  
✅ Vault UI accessible and showing secrets  

---

## 📚 **Documentation Reference**

- **Quick Start**: `VAULT_QUICKSTART.md`
- **Complete Guide**: `VAULT_INTEGRATION_GUIDE.md`
- **This File**: `VAULT_IMPLEMENTATION_STEPS.md`

---

**Ready to proceed? Start with Step 1! 🚀**

