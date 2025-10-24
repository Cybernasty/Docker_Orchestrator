# HashiCorp Vault - Manual Deployment Commands (Linux)

## 🐧 Complete Command Sequence for Linux

Copy and paste these commands one by one in your terminal.

---

## ✅ **Step 1: Create Vault Namespace**

```bash
kubectl create namespace vault
```

---

## ✅ **Step 2: Deploy Vault**

```bash
# Apply configuration
kubectl apply -f k8s/vault-config.yaml

# Apply deployment
kubectl apply -f k8s/vault-deployment.yaml
```

---

## ✅ **Step 3: Wait for Pod to be Ready**

```bash
# Wait for pod
kubectl wait --for=condition=ready pod -l app=vault -n vault --timeout=120s

# Verify pod is running
kubectl get pods -n vault
```

---

## ✅ **Step 4: Set Vault Pod Name as Variable**

```bash
# Save pod name to variable for easier commands
export VAULT_POD=$(kubectl get pod -n vault -l app=vault -o jsonpath='{.items[0].metadata.name}')

# Verify
echo "Vault pod: $VAULT_POD"
```

---

## ✅ **Step 5: Initialize Vault**

```bash
# Initialize Vault
kubectl exec -n vault $VAULT_POD -- vault operator init -key-shares=5 -key-threshold=3
```

**⚠️ CRITICAL**: Copy and save the output! You'll get:
- 5 Unseal Keys
- 1 Root Token

**Save these to a secure location!**

Example output:
```
Unseal Key 1: abc123...
Unseal Key 2: def456...
Unseal Key 3: ghi789...
Unseal Key 4: jkl012...
Unseal Key 5: mno345...

Initial Root Token: s.xyz789...
```

---

## ✅ **Step 6: Unseal Vault**

Replace `<key1>`, `<key2>`, `<key3>` with your actual unseal keys:

```bash
# Unseal with first key
kubectl exec -n vault $VAULT_POD -- vault operator unseal <key1>

# Unseal with second key
kubectl exec -n vault $VAULT_POD -- vault operator unseal <key2>

# Unseal with third key
kubectl exec -n vault $VAULT_POD -- vault operator unseal <key3>
```

---

## ✅ **Step 7: Check Vault Status**

```bash
kubectl exec -n vault $VAULT_POD -- vault status
```

Should show:
```
Sealed: false
```

---

## ✅ **Step 8: Login to Vault**

Replace `<root-token>` with your actual root token:

```bash
kubectl exec -n vault $VAULT_POD -- vault login <root-token>
```

---

## ✅ **Step 9: Enable KV Secrets Engine**

```bash
# Enable KV version 2
kubectl exec -n vault $VAULT_POD -- vault secrets enable -version=2 -path=orchestrator kv

# Verify
kubectl exec -n vault $VAULT_POD -- vault secrets list
```

---

## ✅ **Step 10: Store Application Secrets**

### **Store JWT Secret**

```bash
kubectl exec -n vault $VAULT_POD -- vault kv put orchestrator/jwt \
  secret="your-super-secret-jwt-key-change-this" \
  expires_in="24h"
```

### **Store MongoDB Credentials**

```bash
kubectl exec -n vault $VAULT_POD -- vault kv put orchestrator/mongodb \
  uri="mongodb://mongo-0.mongo-service.default.svc.cluster.local:27017,mongo-1.mongo-service.default.svc.cluster.local:27017/containersDB?replicaSet=rs0" \
  username="admin" \
  password="your-mongodb-password"
```

### **Store Docker Registry Credentials**

```bash
kubectl exec -n vault $VAULT_POD -- vault kv put orchestrator/docker \
  registry="localhost:6500" \
  username="admin" \
  password="your-registry-password"
```

### **Store App Configuration**

```bash
kubectl exec -n vault $VAULT_POD -- vault kv put orchestrator/app \
  cors_origin="*" \
  node_env="production" \
  port="5000"
```

---

## ✅ **Step 11: Verify Secrets Stored**

```bash
# List all secrets
kubectl exec -n vault $VAULT_POD -- vault kv list orchestrator/

# Read JWT secret
kubectl exec -n vault $VAULT_POD -- vault kv get orchestrator/jwt

# Read MongoDB secret
kubectl exec -n vault $VAULT_POD -- vault kv get orchestrator/mongodb
```

---

## ✅ **Step 12: Create Policy for Backend App**

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

# Verify policy
kubectl exec -n vault $VAULT_POD -- vault policy list
kubectl exec -n vault $VAULT_POD -- vault policy read orchestrator-policy
```

---

## ✅ **Step 13: Enable AppRole Authentication**

```bash
# Enable AppRole auth method
kubectl exec -n vault $VAULT_POD -- vault auth enable approle

# Verify
kubectl exec -n vault $VAULT_POD -- vault auth list
```

---

## ✅ **Step 14: Create AppRole for Backend**

```bash
# Create role
kubectl exec -n vault $VAULT_POD -- vault write auth/approle/role/orchestrator-backend \
  token_policies="orchestrator-policy" \
  token_ttl=1h \
  token_max_ttl=4h

# Verify role created
kubectl exec -n vault $VAULT_POD -- vault list auth/approle/role
```

---

## ✅ **Step 15: Get Role ID**

```bash
# Get and display Role ID
kubectl exec -n vault $VAULT_POD -- vault read auth/approle/role/orchestrator-backend/role-id
```

**Save the Role ID!** Example output:
```
Key        Value
---        -----
role_id    abc123-def456-ghi789
```

Or get just the value:
```bash
export ROLE_ID=$(kubectl exec -n vault $VAULT_POD -- vault read -field=role_id auth/approle/role/orchestrator-backend/role-id)
echo "Role ID: $ROLE_ID"
```

---

## ✅ **Step 16: Generate Secret ID**

```bash
# Generate Secret ID
kubectl exec -n vault $VAULT_POD -- vault write -f auth/approle/role/orchestrator-backend/secret-id
```

**Save the Secret ID!** Example output:
```
Key                   Value
---                   -----
secret_id             xyz789-abc123-def456
secret_id_accessor    accessor-id-here
```

Or get just the value:
```bash
export SECRET_ID=$(kubectl exec -n vault $VAULT_POD -- vault write -field=secret_id -f auth/approle/role/orchestrator-backend/secret-id)
echo "Secret ID: $SECRET_ID"
```

---

## ✅ **Step 17: Create Kubernetes Secret for Backend**

```bash
# Create secret with Role ID and Secret ID
kubectl create secret generic vault-auth -n default \
  --from-literal=role-id="$ROLE_ID" \
  --from-literal=secret-id="$SECRET_ID"

# Verify secret created
kubectl get secret vault-auth -n default
kubectl describe secret vault-auth -n default
```

---

## ✅ **Step 18: Install Vault Client in Backend**

```bash
cd backend_orchestrator
npm install node-vault
```

---

## ✅ **Step 19: Update Backend Deployment**

Edit `k8s/backend-deployment.yaml` and add these environment variables under the `env:` section:

```yaml
        env:
        # ... existing environment variables ...
        
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

## ✅ **Step 20: Apply Updated Backend Deployment**

```bash
# Apply changes
kubectl apply -f k8s/backend-deployment.yaml

# Watch rollout
kubectl rollout status deployment/backend -n default

# Check new pods
kubectl get pods -n default -l app=backend
```

---

## ✅ **Step 21: Verify Backend Connects to Vault**

```bash
# Check logs
kubectl logs -n default -l app=backend -f
```

**Expected output:**
```
🔐 Loading secrets from Vault...
✅ Vault client initialized and authenticated
✅ Vault authenticated successfully
   Token TTL: 3600s
✅ Secrets loaded from Vault successfully
🔗 Connected to MongoDB
🚀 Server is running on port 5000
```

---

## ✅ **Step 22: Access Vault UI** (Optional)

```bash
# Port forward
kubectl port-forward -n vault svc/vault-ui 8200:8200
```

Open browser: `http://localhost:8200`

Login with your root token

---

## 🧪 **Step 23: Test Integration**

```bash
# Test from root directory
node test-vault-integration.js
```

---

## 📝 **Quick Command Reference**

### **Check Vault Status**
```bash
export VAULT_POD=$(kubectl get pod -n vault -l app=vault -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n vault $VAULT_POD -- vault status
```

### **List Secrets**
```bash
kubectl exec -n vault $VAULT_POD -- vault kv list orchestrator/
```

### **Read a Secret**
```bash
kubectl exec -n vault $VAULT_POD -- vault kv get orchestrator/jwt
```

### **Update a Secret**
```bash
kubectl exec -n vault $VAULT_POD -- vault kv put orchestrator/jwt \
  secret="new-secret-value" \
  expires_in="24h"
```

### **Unseal Vault (after restart)**
```bash
kubectl exec -n vault $VAULT_POD -- vault operator unseal <key1>
kubectl exec -n vault $VAULT_POD -- vault operator unseal <key2>
kubectl exec -n vault $VAULT_POD -- vault operator unseal <key3>
```

### **Check Backend Logs**
```bash
kubectl logs -n default -l app=backend -f
```

---

## 🔧 **Troubleshooting Commands**

### **Vault pod not starting**
```bash
kubectl describe pod -n vault -l app=vault
kubectl logs -n vault -l app=vault
```

### **Check if Vault is sealed**
```bash
kubectl exec -n vault $VAULT_POD -- vault status | grep Sealed
```

### **Re-generate Secret ID**
```bash
kubectl exec -n vault $VAULT_POD -- vault write -f auth/approle/role/orchestrator-backend/secret-id
```

### **View Vault auth secret**
```bash
kubectl get secret vault-auth -n default -o jsonpath='{.data.role-id}' | base64 -d
echo ""
kubectl get secret vault-auth -n default -o jsonpath='{.data.secret-id}' | base64 -d
echo ""
```

### **Delete and recreate Vault auth secret**
```bash
kubectl delete secret vault-auth -n default
kubectl create secret generic vault-auth -n default \
  --from-literal=role-id="$ROLE_ID" \
  --from-literal=secret-id="$SECRET_ID"
```

---

## ⚡ **All Commands in Sequence** (Copy-Paste Block)

```bash
# 1. Create namespace
kubectl create namespace vault

# 2. Deploy Vault
kubectl apply -f k8s/vault-config.yaml
kubectl apply -f k8s/vault-deployment.yaml

# 3. Wait for pod
kubectl wait --for=condition=ready pod -l app=vault -n vault --timeout=120s

# 4. Get pod name
export VAULT_POD=$(kubectl get pod -n vault -l app=vault -o jsonpath='{.items[0].metadata.name}')
echo "Vault pod: $VAULT_POD"

# 5. Initialize Vault (SAVE THE OUTPUT!)
kubectl exec -n vault $VAULT_POD -- vault operator init -key-shares=5 -key-threshold=3

# 6. Unseal Vault (replace with your actual keys)
kubectl exec -n vault $VAULT_POD -- vault operator unseal <unseal-key-1>
kubectl exec -n vault $VAULT_POD -- vault operator unseal <unseal-key-2>
kubectl exec -n vault $VAULT_POD -- vault operator unseal <unseal-key-3>

# 7. Check status
kubectl exec -n vault $VAULT_POD -- vault status

# 8. Login (replace with your root token)
kubectl exec -n vault $VAULT_POD -- vault login <root-token>

# 9. Enable KV secrets engine
kubectl exec -n vault $VAULT_POD -- vault secrets enable -version=2 -path=orchestrator kv

# 10. Store secrets
kubectl exec -n vault $VAULT_POD -- vault kv put orchestrator/jwt secret="change-this-secret" expires_in="24h"
kubectl exec -n vault $VAULT_POD -- vault kv put orchestrator/mongodb uri="mongodb://mongo:27017/containersDB" username="admin" password="changeme"
kubectl exec -n vault $VAULT_POD -- vault kv put orchestrator/docker registry="localhost:6500" username="admin" password="changeme"
kubectl exec -n vault $VAULT_POD -- vault kv put orchestrator/app cors_origin="*" node_env="production" port="5000"

# 11. Verify secrets
kubectl exec -n vault $VAULT_POD -- vault kv list orchestrator/

# 12. Create policy
kubectl exec -n vault $VAULT_POD -- sh -c 'cat > /tmp/orchestrator-policy.hcl << EOF
path "orchestrator/*" {
  capabilities = ["read", "list"]
}
path "orchestrator/data/*" {
  capabilities = ["read", "list"]
}
EOF'

kubectl exec -n vault $VAULT_POD -- vault policy write orchestrator-policy /tmp/orchestrator-policy.hcl

# 13. Enable AppRole
kubectl exec -n vault $VAULT_POD -- vault auth enable approle

# 14. Create AppRole
kubectl exec -n vault $VAULT_POD -- vault write auth/approle/role/orchestrator-backend \
  token_policies="orchestrator-policy" \
  token_ttl=1h \
  token_max_ttl=4h

# 15. Get Role ID
export ROLE_ID=$(kubectl exec -n vault $VAULT_POD -- vault read -field=role_id auth/approle/role/orchestrator-backend/role-id)
echo "Role ID: $ROLE_ID"

# 16. Generate Secret ID
export SECRET_ID=$(kubectl exec -n vault $VAULT_POD -- vault write -field=secret_id -f auth/approle/role/orchestrator-backend/secret-id)
echo "Secret ID: $SECRET_ID"

# 17. Create Kubernetes secret
kubectl create secret generic vault-auth -n default \
  --from-literal=role-id="$ROLE_ID" \
  --from-literal=secret-id="$SECRET_ID"

# 18. Verify secret created
kubectl get secret vault-auth -n default
```

---

## 🔐 **Step-by-Step with Explanations**

### **Commands 1-4: Deploy Vault**
Creates namespace, deploys Vault, waits for pod to be ready.

### **Command 5: Initialize**
**First-time only!** Creates encryption keys and root token.
⚠️ **NEVER run this twice** - you'll lose access to existing secrets!

### **Commands 6-7: Unseal**
Vault starts sealed for security. You need 3 out of 5 keys to unseal.

### **Command 8: Login**
Authenticates you with Vault using the root token.

### **Command 9: Enable Secrets Engine**
Creates the KV (Key-Value) secrets storage for your application.

### **Command 10: Store Secrets**
Saves all your application secrets in Vault.

### **Commands 11-12: Create Policy**
Defines what permissions the backend app has (read-only access to orchestrator/* path).

### **Commands 13-14: AppRole**
Sets up AppRole authentication method for the backend to authenticate with Vault.

### **Commands 15-16: Get Credentials**
Gets the Role ID and Secret ID that your backend will use to authenticate.

### **Command 17: K8s Secret**
Stores the Role ID and Secret ID as a Kubernetes secret so backend can access them.

---

## 🧪 **Verification Commands**

### **Check Everything is Working**

```bash
# 1. Vault pod running
kubectl get pods -n vault

# 2. Vault unsealed
kubectl exec -n vault $VAULT_POD -- vault status | grep "Sealed"
# Should show: Sealed: false

# 3. Secrets exist
kubectl exec -n vault $VAULT_POD -- vault kv list orchestrator/
# Should show: app, docker, jwt, mongodb

# 4. Policy exists
kubectl exec -n vault $VAULT_POD -- vault policy list
# Should include: orchestrator-policy

# 5. AppRole configured
kubectl exec -n vault $VAULT_POD -- vault list auth/approle/role
# Should show: orchestrator-backend

# 6. K8s secret exists
kubectl get secret vault-auth -n default
# Should show: vault-auth
```

---

## 🌐 **Access Vault UI**

```bash
# Port forward to access UI
kubectl port-forward -n vault svc/vault-ui 8200:8200

# Keep this terminal open and open browser:
# http://localhost:8200

# Login with your root token
```

---

## 🔄 **If You Need to Start Over**

```bash
# Delete everything
kubectl delete namespace vault
kubectl delete secret vault-auth -n default

# Start from Step 1
```

---

## 📋 **Post-Installation**

After completing all steps, follow the backend integration guide:

1. Install `node-vault` in backend: `npm install node-vault` ✅ (Already in package.json)
2. `vaultService.js` already created ✅
3. Update `config.js` to use Vault
4. Update `server.js` to initialize Vault
5. Update backend deployment YAML
6. Deploy updated backend

See `VAULT_IMPLEMENTATION_STEPS.md` for backend integration details.

---

## 🎯 **Quick Copy-Paste for Common Tasks**

### **Unseal Vault After Pod Restart**
```bash
export VAULT_POD=$(kubectl get pod -n vault -l app=vault -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n vault $VAULT_POD -- vault operator unseal <key1>
kubectl exec -n vault $VAULT_POD -- vault operator unseal <key2>
kubectl exec -n vault $VAULT_POD -- vault operator unseal <key3>
```

### **Update JWT Secret**
```bash
export VAULT_POD=$(kubectl get pod -n vault -l app=vault -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n vault $VAULT_POD -- vault kv put orchestrator/jwt \
  secret="$(openssl rand -base64 32)" \
  expires_in="24h"
```

### **Rotate MongoDB Password**
```bash
export VAULT_POD=$(kubectl get pod -n vault -l app=vault -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n vault $VAULT_POD -- vault kv patch orchestrator/mongodb \
  password="new-password-here"
```

---

**Ready to deploy? Start with Step 1! 🚀**

