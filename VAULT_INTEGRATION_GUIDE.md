# HashiCorp Vault Integration Guide

## 🎯 Overview

This guide shows you how to integrate HashiCorp Vault into your Docker Orchestrator platform to securely manage secrets like:
- JWT secrets
- MongoDB credentials
- Docker registry credentials
- API keys
- SSL certificates

---

## 📋 **Step-by-Step Integration**

### **Phase 1: Deploy HashiCorp Vault**

#### **Step 1: Create Vault Namespace**

```bash
kubectl create namespace vault
```

#### **Step 2: Deploy Vault to Kubernetes**

```bash
# Apply configuration and deployment
kubectl apply -f k8s/vault-config.yaml
kubectl apply -f k8s/vault-deployment.yaml
```

#### **Step 3: Verify Vault is Running**

```bash
# Check pods
kubectl get pods -n vault

# Should show:
# NAME                     READY   STATUS    RESTARTS   AGE
# vault-xxxxxxxxxx-xxxxx   1/1     Running   0          1m
```

#### **Step 4: Access Vault UI**

```bash
# Port forward to access Vault UI
kubectl port-forward -n vault svc/vault-ui 8200:8200

# Open in browser: http://localhost:8200
```

---

### **Phase 2: Initialize and Unseal Vault**

#### **Step 1: Initialize Vault**

```bash
# Get Vault pod name
export VAULT_POD=$(kubectl get pod -n vault -l app=vault -o jsonpath='{.items[0].metadata.name}')

# Initialize Vault
kubectl exec -n vault $VAULT_POD -- vault operator init -key-shares=5 -key-threshold=3
```

**⚠️ IMPORTANT**: Save the output! You'll get:
- 5 unseal keys
- 1 root token

**Example output:**
```
Unseal Key 1: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Unseal Key 2: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Unseal Key 3: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Unseal Key 4: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Unseal Key 5: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Initial Root Token: s.xxxxxxxxxxxxxxxxxxxx
```

#### **Step 2: Unseal Vault**

```bash
# Unseal with 3 keys (threshold)
kubectl exec -n vault $VAULT_POD -- vault operator unseal <key1>
kubectl exec -n vault $VAULT_POD -- vault operator unseal <key2>
kubectl exec -n vault $VAULT_POD -- vault operator unseal <key3>

# Check status
kubectl exec -n vault $VAULT_POD -- vault status
```

#### **Step 3: Login with Root Token**

```bash
kubectl exec -n vault $VAULT_POD -- vault login <root-token>
```

---

### **Phase 3: Configure Vault for Your Application**

#### **Step 1: Enable KV Secrets Engine**

```bash
# Enable Key-Value secrets engine v2
kubectl exec -n vault $VAULT_POD -- vault secrets enable -version=2 -path=orchestrator kv

# Verify
kubectl exec -n vault $VAULT_POD -- vault secrets list
```

#### **Step 2: Store Application Secrets**

```bash
# Store JWT secret
kubectl exec -n vault $VAULT_POD -- vault kv put orchestrator/jwt \
  secret="your-super-secret-jwt-key-change-in-production" \
  expires_in="24h"

# Store MongoDB credentials
kubectl exec -n vault $VAULT_POD -- vault kv put orchestrator/mongodb \
  uri="mongodb://mongo:27017/containersDB" \
  username="admin" \
  password="secure-mongo-password"

# Store Docker registry credentials
kubectl exec -n vault $VAULT_POD -- vault kv put orchestrator/docker \
  registry="localhost:6500" \
  username="admin" \
  password="registry-password"

# Store application config
kubectl exec -n vault $VAULT_POD -- vault kv put orchestrator/app \
  cors_origin="http://localhost:3000" \
  node_env="production" \
  port="5000"
```

#### **Step 3: Create Vault Policy for Backend App**

```bash
# Create policy file
kubectl exec -n vault $VAULT_POD -- sh -c 'cat > /tmp/orchestrator-policy.hcl << EOF
path "orchestrator/*" {
  capabilities = ["read", "list"]
}

path "orchestrator/data/*" {
  capabilities = ["read", "list"]
}
EOF'

# Apply policy
kubectl exec -n vault $VAULT_POD -- vault policy write orchestrator-policy /tmp/orchestrator-policy.hcl
```

#### **Step 4: Enable AppRole Authentication**

```bash
# Enable AppRole auth method
kubectl exec -n vault $VAULT_POD -- vault auth enable approle

# Create role for backend app
kubectl exec -n vault $VAULT_POD -- vault write auth/approle/role/orchestrator-backend \
  token_policies="orchestrator-policy" \
  token_ttl=1h \
  token_max_ttl=4h

# Get role ID
kubectl exec -n vault $VAULT_POD -- vault read auth/approle/role/orchestrator-backend/role-id

# Generate secret ID
kubectl exec -n vault $VAULT_POD -- vault write -f auth/approle/role/orchestrator-backend/secret-id
```

**Save the Role ID and Secret ID** - you'll need them for the backend application.

---

### **Phase 4: Integrate Vault with Backend Application**

#### **Step 1: Install Vault Client for Node.js**

```bash
cd backend_orchestrator
npm install node-vault
```

#### **Step 2: Create Vault Service**

Create `backend_orchestrator/services/vaultService.js`:

```javascript
import vault from 'node-vault';

class VaultService {
  constructor() {
    this.client = null;
    this.token = null;
  }

  async initialize() {
    // Initialize Vault client
    this.client = vault({
      apiVersion: 'v1',
      endpoint: process.env.VAULT_ADDR || 'http://vault.vault.svc.cluster.local:8200',
      requestOptions: {
        timeout: 5000
      }
    });

    // Authenticate with AppRole
    await this.authenticate();
    
    console.log('✅ Vault client initialized and authenticated');
  }

  async authenticate() {
    try {
      const roleId = process.env.VAULT_ROLE_ID;
      const secretId = process.env.VAULT_SECRET_ID;

      if (!roleId || !secretId) {
        throw new Error('VAULT_ROLE_ID and VAULT_SECRET_ID must be set');
      }

      // Login with AppRole
      const result = await this.client.approleLogin({
        role_id: roleId,
        secret_id: secretId
      });

      this.token = result.auth.client_token;
      this.client.token = this.token;

      console.log('✅ Vault authenticated successfully');
      
      // Schedule token renewal
      this.scheduleTokenRenewal(result.auth.lease_duration);
    } catch (error) {
      console.error('❌ Vault authentication failed:', error.message);
      throw error;
    }
  }

  scheduleTokenRenewal(leaseDuration) {
    // Renew token before it expires (80% of lease duration)
    const renewalTime = (leaseDuration * 0.8) * 1000;
    
    setTimeout(async () => {
      try {
        await this.client.tokenRenewSelf();
        console.log('✅ Vault token renewed');
        this.scheduleTokenRenewal(leaseDuration);
      } catch (error) {
        console.error('❌ Token renewal failed:', error.message);
        await this.authenticate(); // Re-authenticate if renewal fails
      }
    }, renewalTime);
  }

  async getSecret(path) {
    try {
      const result = await this.client.read(`orchestrator/data/${path}`);
      return result.data.data;
    } catch (error) {
      console.error(`❌ Failed to read secret ${path}:`, error.message);
      throw error;
    }
  }

  async getJWTSecret() {
    const secrets = await this.getSecret('jwt');
    return secrets.secret;
  }

  async getMongoURI() {
    const secrets = await this.getSecret('mongodb');
    return secrets.uri;
  }

  async getDockerRegistryCredentials() {
    const secrets = await this.getSecret('docker');
    return {
      registry: secrets.registry,
      username: secrets.username,
      password: secrets.password
    };
  }

  async getAllSecrets() {
    const [jwt, mongodb, docker, app] = await Promise.all([
      this.getSecret('jwt'),
      this.getSecret('mongodb'),
      this.getSecret('docker'),
      this.getSecret('app')
    ]);

    return { jwt, mongodb, docker, app };
  }
}

// Singleton instance
const vaultService = new VaultService();

export default vaultService;
```

#### **Step 3: Update Config to Use Vault**

Update `backend_orchestrator/config/config.js`:

```javascript
import dotenv from "dotenv";
import vaultService from "../services/vaultService.js";

dotenv.config();

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
  
  // Vault configuration
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
      config.jwtExpiresIn = secrets.jwt.expires_in;
      config.mongoUri = secrets.mongodb.uri;
      config.corsOrigin = secrets.app.cors_origin;
      
      console.log('✅ Secrets loaded from Vault successfully');
    } catch (error) {
      console.error('❌ Failed to load secrets from Vault:', error.message);
      console.log('⚠️  Falling back to environment variables');
    }
  } else {
    console.log('ℹ️  Using environment variables for configuration');
  }
  
  return config;
}

export default config;
```

#### **Step 4: Update server.js to Initialize Vault**

Update `backend_orchestrator/server.js`:

```javascript
import { initializeConfig } from "./config/config.js";

// ... other imports ...

async function startServer() {
  try {
    // Initialize configuration (load from Vault if enabled)
    const config = await initializeConfig();
    
    // Connect to database
    await connectDB();
    
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

### **Phase 5: Deploy with Vault Integration**

#### **Step 1: Create Kubernetes Secret for Vault Auth**

```bash
# Create secret with Role ID and Secret ID from Phase 3, Step 4
kubectl create secret generic vault-auth -n default \
  --from-literal=role-id='your-role-id-here' \
  --from-literal=secret-id='your-secret-id-here'
```

#### **Step 2: Update Backend Deployment**

Update `k8s/backend-deployment.yaml` to include Vault environment variables:

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

#### **Step 3: Apply Updated Deployment**

```bash
kubectl apply -f k8s/backend-deployment.yaml
```

---

## 🔧 **Local Development with Vault**

### **Option 1: Run Vault Locally with Docker**

```bash
# Start Vault in dev mode (NOT for production!)
docker run -d --name vault-dev -p 8200:8200 \
  -e 'VAULT_DEV_ROOT_TOKEN_ID=myroot' \
  -e 'VAULT_DEV_LISTEN_ADDRESS=0.0.0.0:8200' \
  hashicorp/vault:latest

# Set environment variables
export VAULT_ADDR='http://localhost:8200'
export VAULT_TOKEN='myroot'

# Store secrets
vault kv put orchestrator/jwt secret="local-jwt-secret" expires_in="24h"
vault kv put orchestrator/mongodb uri="mongodb://localhost:27017/containersDB"
vault kv put orchestrator/docker registry="localhost:6500"
vault kv put orchestrator/app cors_origin="http://localhost:3000" node_env="development"
```

### **Option 2: Use Vault CLI Locally**

```bash
# Install Vault CLI
# Windows: Download from https://www.vaultproject.io/downloads
# Mac: brew install vault
# Linux: apt-get install vault

# Login
vault login <root-token>

# Store secrets
vault kv put orchestrator/jwt \
  secret="your-jwt-secret" \
  expires_in="24h"

vault kv put orchestrator/mongodb \
  uri="mongodb://localhost:27017/containersDB"
```

### **Step 3: Update Local .env**

```env
# Enable Vault
USE_VAULT=true

# Vault configuration
VAULT_ADDR=http://localhost:8200
VAULT_ROLE_ID=your-role-id
VAULT_SECRET_ID=your-secret-id

# Fallback values (if Vault is unavailable)
JWT_SECRET=fallback-secret
MONGO_URI=mongodb://localhost:27017/containersDB
```

---

## 🔐 **Managing Secrets in Vault**

### **Store Secrets**

```bash
# Via Vault CLI
vault kv put orchestrator/jwt secret="new-secret-value"

# Via API (using curl)
curl -X POST http://localhost:8200/v1/orchestrator/data/jwt \
  -H "X-Vault-Token: $VAULT_TOKEN" \
  -d '{"data": {"secret": "new-secret-value", "expires_in": "24h"}}'

# Via Vault UI
# 1. Open http://localhost:8200
# 2. Login with root token
# 3. Navigate to orchestrator/
# 4. Add/edit secrets
```

### **Read Secrets**

```bash
# Via Vault CLI
vault kv get orchestrator/jwt

# Via API
curl -H "X-Vault-Token: $VAULT_TOKEN" \
  http://localhost:8200/v1/orchestrator/data/jwt
```

### **List Secrets**

```bash
# List all secret paths
vault kv list orchestrator/

# Output:
# Keys
# ----
# app
# docker
# jwt
# mongodb
```

### **Delete Secrets**

```bash
vault kv delete orchestrator/old-secret
```

---

## 🔄 **Secret Rotation Strategy**

### **Automatic Rotation with Vault**

Create a rotation script `rotate-secrets.sh`:

```bash
#!/bin/bash

# Generate new JWT secret
NEW_JWT_SECRET=$(openssl rand -base64 32)

# Update in Vault
vault kv put orchestrator/jwt secret="$NEW_JWT_SECRET" expires_in="24h"

# Update MongoDB password
vault kv patch orchestrator/mongodb password="new-mongo-password"

echo "✅ Secrets rotated successfully"
echo "⚠️  Restart backend pods to use new secrets"
```

### **Schedule Rotation**

```bash
# Add to cron (monthly rotation)
0 0 1 * * /path/to/rotate-secrets.sh
```

---

## 🛡️ **Security Best Practices**

### **1. Never Commit Vault Tokens**

Add to `.gitignore`:
```
.vault-token
vault-keys.txt
.env
```

### **2. Use Different Policies for Different Apps**

```bash
# Read-only policy for monitoring apps
vault policy write monitoring-readonly - <<EOF
path "orchestrator/data/monitoring/*" {
  capabilities = ["read", "list"]
}
EOF
```

### **3. Enable Audit Logging**

```bash
vault audit enable file file_path=/vault/logs/audit.log
```

### **4. Use Namespaces (Vault Enterprise)**

```bash
vault namespace create dev
vault namespace create prod
```

### **5. Regular Backups**

```bash
# Backup Vault data
kubectl exec -n vault $VAULT_POD -- tar czf - /vault/data > vault-backup-$(date +%Y%m%d).tar.gz
```

---

## 📊 **Secrets Management in Your Application**

### **Current Secrets to Migrate:**

From `backend_orchestrator/.env`:
```
✅ JWT_SECRET → vault: orchestrator/jwt
✅ JWT_EXPIRES_IN → vault: orchestrator/jwt
✅ MONGO_URI → vault: orchestrator/mongodb
✅ CORS_ORIGIN → vault: orchestrator/app
✅ DOCKER_SOCKET → vault: orchestrator/docker
✅ (Future) SSL certificates → vault: orchestrator/ssl
```

---

## 🧪 **Testing Vault Integration**

### **Test Script: `test-vault-integration.js`**

```javascript
import vaultService from './services/vaultService.js';

async function testVault() {
  console.log('🧪 Testing Vault Integration...\n');
  
  try {
    // Initialize
    await vaultService.initialize();
    
    // Get JWT secret
    const jwtSecret = await vaultService.getJWTSecret();
    console.log('✅ JWT Secret retrieved:', jwtSecret.substring(0, 10) + '...');
    
    // Get MongoDB URI
    const mongoUri = await vaultService.getMongoURI();
    console.log('✅ MongoDB URI retrieved:', mongoUri);
    
    // Get Docker credentials
    const dockerCreds = await vaultService.getDockerRegistryCredentials();
    console.log('✅ Docker Registry:', dockerCreds.registry);
    
    console.log('\n🎉 All secrets retrieved successfully from Vault!');
  } catch (error) {
    console.error('❌ Vault test failed:', error.message);
  }
}

testVault();
```

Run test:
```bash
node test-vault-integration.js
```

---

## 📈 **Monitoring Vault**

### **Check Vault Health**

```bash
# Health check
curl http://localhost:8200/v1/sys/health

# Metrics (Prometheus format)
curl http://localhost:8200/v1/sys/metrics
```

### **View Audit Logs**

```bash
kubectl exec -n vault $VAULT_POD -- tail -f /vault/logs/audit.log
```

---

## 🔄 **Deployment Workflow**

### **Complete Deployment Steps**

```bash
# 1. Deploy Vault
kubectl apply -f k8s/vault-config.yaml
kubectl apply -f k8s/vault-deployment.yaml

# 2. Initialize and unseal
export VAULT_POD=$(kubectl get pod -n vault -l app=vault -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n vault $VAULT_POD -- vault operator init -key-shares=5 -key-threshold=3
kubectl exec -n vault $VAULT_POD -- vault operator unseal <key1>
kubectl exec -n vault $VAULT_POD -- vault operator unseal <key2>
kubectl exec -n vault $VAULT_POD -- vault operator unseal <key3>

# 3. Configure Vault
kubectl exec -n vault $VAULT_POD -- vault login <root-token>
kubectl exec -n vault $VAULT_POD -- vault secrets enable -version=2 -path=orchestrator kv
kubectl exec -n vault $VAULT_POD -- vault auth enable approle

# 4. Store secrets
kubectl exec -n vault $VAULT_POD -- vault kv put orchestrator/jwt secret="your-secret"
kubectl exec -n vault $VAULT_POD -- vault kv put orchestrator/mongodb uri="mongodb://..."

# 5. Create policy and role
kubectl exec -n vault $VAULT_POD -- vault policy write orchestrator-policy /tmp/policy.hcl
kubectl exec -n vault $VAULT_POD -- vault write auth/approle/role/orchestrator-backend token_policies="orchestrator-policy"

# 6. Get credentials
ROLE_ID=$(kubectl exec -n vault $VAULT_POD -- vault read -field=role_id auth/approle/role/orchestrator-backend/role-id)
SECRET_ID=$(kubectl exec -n vault $VAULT_POD -- vault write -field=secret_id -f auth/approle/role/orchestrator-backend/secret-id)

# 7. Create Kubernetes secret
kubectl create secret generic vault-auth -n default \
  --from-literal=role-id="$ROLE_ID" \
  --from-literal=secret-id="$SECRET_ID"

# 8. Deploy backend with Vault integration
kubectl apply -f k8s/backend-deployment.yaml
```

---

## 🎯 **Migration Checklist**

### **Pre-Migration**
- [ ] Vault deployed and initialized
- [ ] Vault unsealed
- [ ] KV secrets engine enabled
- [ ] AppRole authentication configured
- [ ] Vault policy created
- [ ] Role ID and Secret ID obtained

### **Migration**
- [ ] All secrets stored in Vault
- [ ] Vault service created in backend
- [ ] Config updated to use Vault
- [ ] server.js updated to initialize Vault
- [ ] Kubernetes secrets created for Vault auth
- [ ] Backend deployment updated with Vault env vars

### **Post-Migration**
- [ ] Backend successfully connects to Vault
- [ ] Secrets retrieved correctly
- [ ] Application functions normally
- [ ] .env file backed up
- [ ] Sensitive values removed from .env
- [ ] Token renewal working
- [ ] Vault audit logs enabled

---

## 📚 **Vault Commands Cheat Sheet**

```bash
# Status
vault status

# Login
vault login <token>

# Store secret
vault kv put orchestrator/path key=value

# Read secret
vault kv get orchestrator/path

# List secrets
vault kv list orchestrator/

# Delete secret
vault kv delete orchestrator/path

# Create policy
vault policy write policy-name policy-file.hcl

# List policies
vault policy list

# Read policy
vault policy read policy-name

# Enable auth method
vault auth enable approle

# Create AppRole
vault write auth/approle/role/my-role token_policies="my-policy"

# Get Role ID
vault read auth/approle/role/my-role/role-id

# Generate Secret ID
vault write -f auth/approle/role/my-role/secret-id

# Seal Vault
vault operator seal

# Unseal Vault
vault operator unseal <key>
```

---

## 🚨 **Important Security Notes**

### **DO:**
✅ Keep unseal keys in separate secure locations
✅ Rotate root token after initial setup
✅ Use AppRole for application authentication
✅ Enable audit logging
✅ Regularly backup Vault data
✅ Use TLS in production
✅ Implement secret rotation policies

### **DON'T:**
❌ Commit Vault tokens to Git
❌ Share root token
❌ Use dev mode in production
❌ Disable TLS in production
❌ Store unseal keys in the same location
❌ Use default secrets/passwords

---

## 📖 **Additional Resources**

- **Vault Documentation**: https://www.vaultproject.io/docs
- **Vault API**: https://www.vaultproject.io/api-docs
- **Best Practices**: https://learn.hashicorp.com/vault
- **Kubernetes Integration**: https://www.vaultproject.io/docs/platform/k8s

---

**Next Steps**: Follow Phase 1 to deploy Vault, then proceed through each phase sequentially!

