@echo off
setlocal enabledelayedexpansion

echo 🔐 HashiCorp Vault Deployment Script
echo ======================================
echo.

REM Step 1: Create namespace
echo 📦 Step 1: Creating Vault namespace...
kubectl create namespace vault >nul 2>&1
echo ✅ Namespace created
echo.

REM Step 2: Deploy Vault
echo 🚀 Step 2: Deploying Vault...
kubectl apply -f k8s/vault-config.yaml
kubectl apply -f k8s/vault-deployment.yaml
echo ✅ Vault deployment applied
echo.

REM Step 3: Wait for pod
echo ⏳ Step 3: Waiting for Vault pod to be ready...
kubectl wait --for=condition=ready pod -l app=vault -n vault --timeout=120s
echo ✅ Vault pod is ready
echo.

REM Get pod name
for /f "delims=" %%i in ('kubectl get pod -n vault -l app=vault -o jsonpath^="{.items[0].metadata.name}"') do set VAULT_POD=%%i
echo 📝 Vault pod: %VAULT_POD%
echo.

REM Step 4: Initialize Vault
echo 🔑 Step 4: Initializing Vault...
echo ⚠️  IMPORTANT: Save the unseal keys and root token!
echo.

kubectl exec -n vault %VAULT_POD% -- vault operator init -key-shares=5 -key-threshold=3 > vault-init-output.txt
type vault-init-output.txt
echo.

REM Parse output
for /f "tokens=4" %%a in ('findstr /C:"Unseal Key 1:" vault-init-output.txt') do set UNSEAL_KEY_1=%%a
for /f "tokens=4" %%a in ('findstr /C:"Unseal Key 2:" vault-init-output.txt') do set UNSEAL_KEY_2=%%a
for /f "tokens=4" %%a in ('findstr /C:"Unseal Key 3:" vault-init-output.txt') do set UNSEAL_KEY_3=%%a
for /f "tokens=4" %%a in ('findstr /C:"Initial Root Token:" vault-init-output.txt') do set ROOT_TOKEN=%%a

echo ✅ Keys saved to vault-keys.txt
echo ⚠️  SECURE THIS FILE IMMEDIATELY!
echo.

REM Step 5: Unseal
echo 🔓 Step 5: Unsealing Vault...
kubectl exec -n vault %VAULT_POD% -- vault operator unseal %UNSEAL_KEY_1%
kubectl exec -n vault %VAULT_POD% -- vault operator unseal %UNSEAL_KEY_2%
kubectl exec -n vault %VAULT_POD% -- vault operator unseal %UNSEAL_KEY_3%
echo ✅ Vault unsealed
echo.

REM Step 6: Login
echo 🔐 Step 6: Logging in to Vault...
kubectl exec -n vault %VAULT_POD% -- vault login %ROOT_TOKEN%
echo ✅ Logged in
echo.

REM Step 7: Enable secrets engine
echo 📂 Step 7: Enabling KV secrets engine...
kubectl exec -n vault %VAULT_POD% -- vault secrets enable -version=2 -path=orchestrator kv
echo ✅ KV secrets engine enabled
echo.

REM Step 8: Enable AppRole
echo 🔑 Step 8: Enabling AppRole...
kubectl exec -n vault %VAULT_POD% -- vault auth enable approle
echo ✅ AppRole enabled
echo.

echo ======================================
echo 🎉 Vault deployment complete!
echo ======================================
echo.
echo 📝 Next steps:
echo 1. Check vault-keys.txt for unseal keys and root token
echo 2. Run: kubectl port-forward -n vault svc/vault-ui 8200:8200
echo 3. Open: http://localhost:8200
echo 4. Login with root token: %ROOT_TOKEN%
echo.

copy vault-init-output.txt vault-keys.txt >nul
del vault-init-output.txt

