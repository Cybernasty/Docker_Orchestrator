#!/bin/bash

# Deploy Fixed Orchestrator Application to Ubuntu Kubernetes Cluster
# This script fixes the SSL and Docker socket mount issues

set -e

echo "🚀 Deploying Fixed Orchestrator Application to Ubuntu Kubernetes Cluster"

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed or not in PATH"
    exit 1
fi

# Check if we can connect to the cluster
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Cannot connect to Kubernetes cluster"
    exit 1
fi

echo "✅ Connected to Kubernetes cluster"

# Create namespace if it doesn't exist
echo "📦 Creating namespace..."
kubectl create namespace orchestrator --dry-run=client -o yaml | kubectl apply -f -

# Apply secrets
echo "🔐 Creating secrets..."
kubectl apply -f secrets.yaml

# Apply configmap
echo "⚙️  Creating configmap..."
kubectl apply -f configmap.yaml

# Apply backend deployment
echo "🔧 Deploying backend..."
kubectl apply -f backend-deployment.yaml

# Apply frontend deployment
echo "🎨 Deploying frontend..."
kubectl apply -f frontend-deployment.yaml

# Apply services
echo "🌐 Creating services..."
kubectl apply -f services.yaml

# Wait for deployments to be ready
echo "⏳ Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/frontend-orchestrator -n orchestrator
kubectl wait --for=condition=ready --timeout=300s statefulset/backend-orchestrator -n orchestrator

# Show status
echo "📊 Application Status:"
kubectl get pods -n orchestrator
kubectl get services -n orchestrator

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Access Information:"
echo "   Frontend: http://<node-ip>:30080"
echo "   Backend:  http://<node-ip>:30050"
echo ""
echo "🔍 To check logs:"
echo "   kubectl logs -f deployment/frontend-orchestrator -n orchestrator"
echo "   kubectl logs -f statefulset/backend-orchestrator -n orchestrator"
echo ""
echo "🔧 To describe pods:"
echo "   kubectl describe pods -n orchestrator"








