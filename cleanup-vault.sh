#!/bin/bash

# Vault Cleanup Script
# Use this to completely remove Vault and start fresh

echo "🧹 Cleaning up Vault deployment..."
echo ""

# Delete all Vault resources
kubectl delete deployment vault -n vault 2>/dev/null || echo "No deployment to delete"
kubectl delete service vault -n vault 2>/dev/null || echo "No service to delete"
kubectl delete service vault-ui -n vault 2>/dev/null || echo "No vault-ui service to delete"
kubectl delete pvc vault-data -n vault 2>/dev/null || echo "No PVC to delete"
kubectl delete configmap vault-config -n vault 2>/dev/null || echo "No ConfigMap to delete"
kubectl delete serviceaccount vault -n vault 2>/dev/null || echo "No ServiceAccount to delete"

# Wait a bit
sleep 5

# Check if anything remains
echo ""
echo "📊 Remaining resources in vault namespace:"
kubectl get all -n vault

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "To delete the namespace completely (optional):"
echo "  kubectl delete namespace vault"
echo ""

