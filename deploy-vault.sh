#!/bin/bash

# HashiCorp Vault Deployment Script for Docker Orchestrator
# This script automates the deployment and initialization of Vault

set -e

echo "🔐 HashiCorp Vault Deployment Script"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Create namespace
echo "📦 Step 1: Creating Vault namespace..."
kubectl create namespace vault --dry-run=client -o yaml | kubectl apply -f -
echo -e "${GREEN}✅ Namespace created${NC}\n"

# Step 2: Deploy Vault
echo "🚀 Step 2: Deploying Vault..."
kubectl apply -f k8s/vault-config.yaml
kubectl apply -f k8s/vault-deployment.yaml
echo -e "${GREEN}✅ Vault deployment applied${NC}\n"

# Step 3: Wait for pod to be ready
echo "⏳ Step 3: Waiting for Vault pod to be ready..."
kubectl wait --for=condition=ready pod -l app=vault -n vault --timeout=120s
echo -e "${GREEN}✅ Vault pod is ready${NC}\n"

# Get pod name
export VAULT_POD=$(kubectl get pod -n vault -l app=vault -o jsonpath='{.items[0].metadata.name}')
echo "📝 Vault pod: $VAULT_POD"
echo ""

# Step 4: Initialize Vault
echo "🔑 Step 4: Initializing Vault..."
echo -e "${YELLOW}⚠️  IMPORTANT: Save the unseal keys and root token!${NC}"
echo ""

INIT_OUTPUT=$(kubectl exec -n vault $VAULT_POD -- vault operator init -key-shares=5 -key-threshold=3)
echo "$INIT_OUTPUT"
echo ""

# Parse keys and token
UNSEAL_KEY_1=$(echo "$INIT_OUTPUT" | grep 'Unseal Key 1:' | awk '{print $NF}')
UNSEAL_KEY_2=$(echo "$INIT_OUTPUT" | grep 'Unseal Key 2:' | awk '{print $NF}')
UNSEAL_KEY_3=$(echo "$INIT_OUTPUT" | grep 'Unseal Key 3:' | awk '{print $NF}')
ROOT_TOKEN=$(echo "$INIT_OUTPUT" | grep 'Initial Root Token:' | awk '{print $NF}')

# Save to file (secure this file!)
cat > vault-keys.txt << EOF
===========================================
VAULT INITIALIZATION - SAVE THESE SECURELY
===========================================

$INIT_OUTPUT

===========================================
EOF

echo -e "${GREEN}✅ Keys saved to vault-keys.txt${NC}"
echo -e "${RED}⚠️  SECURE THIS FILE IMMEDIATELY!${NC}\n"

# Step 5: Unseal Vault
echo "🔓 Step 5: Unsealing Vault..."
kubectl exec -n vault $VAULT_POD -- vault operator unseal $UNSEAL_KEY_1
kubectl exec -n vault $VAULT_POD -- vault operator unseal $UNSEAL_KEY_2
kubectl exec -n vault $VAULT_POD -- vault operator unseal $UNSEAL_KEY_3
echo -e "${GREEN}✅ Vault unsealed${NC}\n"

# Step 6: Login
echo "🔐 Step 6: Logging in to Vault..."
kubectl exec -n vault $VAULT_POD -- vault login $ROOT_TOKEN
echo -e "${GREEN}✅ Logged in${NC}\n"

# Step 7: Enable secrets engine
echo "📂 Step 7: Enabling KV secrets engine..."
kubectl exec -n vault $VAULT_POD -- vault secrets enable -version=2 -path=orchestrator kv
echo -e "${GREEN}✅ KV secrets engine enabled${NC}\n"

# Step 8: Enable AppRole
echo "🔑 Step 8: Enabling AppRole authentication..."
kubectl exec -n vault $VAULT_POD -- vault auth enable approle
echo -e "${GREEN}✅ AppRole enabled${NC}\n"

# Step 9: Create policy
echo "📜 Step 9: Creating application policy..."
kubectl exec -n vault $VAULT_POD -- sh -c 'cat > /tmp/orchestrator-policy.hcl << EOF
path "orchestrator/*" {
  capabilities = ["read", "list"]
}

path "orchestrator/data/*" {
  capabilities = ["read", "list"]
}
EOF'

kubectl exec -n vault $VAULT_POD -- vault policy write orchestrator-policy /tmp/orchestrator-policy.hcl
echo -e "${GREEN}✅ Policy created${NC}\n"

# Step 10: Create AppRole
echo "🎭 Step 10: Creating AppRole for backend..."
kubectl exec -n vault $VAULT_POD -- vault write auth/approle/role/orchestrator-backend \
  token_policies="orchestrator-policy" \
  token_ttl=1h \
  token_max_ttl=4h
echo -e "${GREEN}✅ AppRole created${NC}\n"

# Step 11: Get credentials
echo "🔑 Step 11: Getting AppRole credentials..."
ROLE_ID=$(kubectl exec -n vault $VAULT_POD -- vault read -field=role_id auth/approle/role/orchestrator-backend/role-id)
SECRET_ID=$(kubectl exec -n vault $VAULT_POD -- vault write -field=secret_id -f auth/approle/role/orchestrator-backend/secret-id)

echo "Role ID: $ROLE_ID"
echo "Secret ID: $SECRET_ID"
echo ""

# Save credentials
cat >> vault-keys.txt << EOF

===========================================
APPROLE CREDENTIALS
===========================================
Role ID: $ROLE_ID
Secret ID: $SECRET_ID
===========================================
EOF

echo -e "${GREEN}✅ Credentials saved to vault-keys.txt${NC}\n"

# Step 12: Store sample secrets
echo "💾 Step 12: Storing sample secrets..."
kubectl exec -n vault $VAULT_POD -- vault kv put orchestrator/jwt \
  secret="change-this-in-production-$(openssl rand -hex 16)" \
  expires_in="24h"

kubectl exec -n vault $VAULT_POD -- vault kv put orchestrator/mongodb \
  uri="mongodb://mongo:27017/containersDB" \
  username="admin" \
  password="changeme"

kubectl exec -n vault $VAULT_POD -- vault kv put orchestrator/docker \
  registry="localhost:6500" \
  username="admin" \
  password="changeme"

kubectl exec -n vault $VAULT_POD -- vault kv put orchestrator/app \
  cors_origin="http://localhost:3000" \
  node_env="production" \
  port="5000"

echo -e "${GREEN}✅ Sample secrets stored${NC}\n"

# Step 13: Create Kubernetes secret
echo "🔒 Step 13: Creating Kubernetes secret for Vault auth..."
kubectl create secret generic vault-auth -n default \
  --from-literal=role-id="$ROLE_ID" \
  --from-literal=secret-id="$SECRET_ID" \
  --dry-run=client -o yaml | kubectl apply -f -
echo -e "${GREEN}✅ Kubernetes secret created${NC}\n"

# Summary
echo "======================================"
echo -e "${GREEN}🎉 Vault deployment complete!${NC}"
echo "======================================"
echo ""
echo "📝 Next steps:"
echo "1. Secure vault-keys.txt file (contains unseal keys and root token)"
echo "2. Update secrets in Vault with production values:"
echo "   kubectl exec -n vault $VAULT_POD -- vault kv put orchestrator/jwt secret=\"your-production-secret\""
echo "3. Update backend deployment with Vault integration:"
echo "   kubectl apply -f k8s/backend-deployment.yaml"
echo "4. Verify backend can access Vault:"
echo "   kubectl logs -n default -l app=backend"
echo ""
echo "🌐 Access Vault UI:"
echo "   kubectl port-forward -n vault svc/vault-ui 8200:8200"
echo "   Open: http://localhost:8200"
echo "   Token: $ROOT_TOKEN"
echo ""

