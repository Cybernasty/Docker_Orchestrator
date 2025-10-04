# Deploy Orchestrator to External Kubernetes Cluster
# This script deploys the application to an external Kubernetes cluster

param(
    [string]$Registry = "your-registry.com",
    [string]$Namespace = "orchestrator",
    [switch]$SkipBuild,
    [switch]$Force
)

Write-Host "🚀 Deploying Orchestrator to External Kubernetes Cluster" -ForegroundColor Green
Write-Host "Registry: $Registry" -ForegroundColor Cyan
Write-Host "Namespace: $Namespace" -ForegroundColor Cyan

# Check if kubectl is available
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Host "❌ kubectl is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check cluster connectivity
Write-Host "🔍 Checking cluster connectivity..." -ForegroundColor Yellow
try {
    $clusterInfo = kubectl cluster-info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Cannot connect to Kubernetes cluster" -ForegroundColor Red
        Write-Host $clusterInfo -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Connected to cluster" -ForegroundColor Green
} catch {
    Write-Host "❌ Error connecting to cluster: $_" -ForegroundColor Red
    exit 1
}

# Build and push images if not skipped
if (-not $SkipBuild) {
    Write-Host "🔨 Building and pushing images..." -ForegroundColor Yellow
    
    # Build backend image
    Write-Host "Building backend image..." -ForegroundColor Cyan
    docker build -t $Registry/orchestrator-backend:latest ../backend_orchestrator
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to build backend image" -ForegroundColor Red
        exit 1
    }
    
    # Build frontend image
    Write-Host "Building frontend image..." -ForegroundColor Cyan
    docker build -t $Registry/orchestrator-frontend:latest ../frontend_orchestrator
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to build frontend image" -ForegroundColor Red
        exit 1
    }
    
    # Push images
    Write-Host "Pushing images to registry..." -ForegroundColor Cyan
    docker push $Registry/orchestrator-backend:latest
    docker push $Registry/orchestrator-frontend:latest
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to push images" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Images built and pushed successfully" -ForegroundColor Green
} else {
    Write-Host "⏭️ Skipping image build and push" -ForegroundColor Yellow
}

# Create namespace if it doesn't exist
Write-Host "📁 Creating namespace..." -ForegroundColor Yellow
kubectl create namespace $Namespace --dry-run=client -o yaml | kubectl apply -f -

# Apply secrets first
Write-Host "🔐 Applying secrets..." -ForegroundColor Yellow
kubectl apply -f secrets.yaml -n $Namespace

# Apply ConfigMap
Write-Host "⚙️ Applying ConfigMap..." -ForegroundColor Yellow
kubectl apply -f external-cluster-configmap.yaml -n $Namespace

# Apply backend deployment
Write-Host "🔧 Deploying backend..." -ForegroundColor Yellow
kubectl apply -f external-cluster-deployment.yaml -n $Namespace

# Apply frontend deployment
Write-Host "🎨 Deploying frontend..." -ForegroundColor Yellow
kubectl apply -f external-cluster-frontend.yaml -n $Namespace

# Apply ingress (if available)
if (Test-Path "ingress.yaml") {
    Write-Host "🌐 Applying ingress..." -ForegroundColor Yellow
    kubectl apply -f ingress.yaml -n $Namespace
}

# Wait for deployments to be ready
Write-Host "⏳ Waiting for deployments to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=available --timeout=300s deployment/frontend-orchestrator -n $Namespace
kubectl wait --for=condition=ready --timeout=300s statefulset/backend-orchestrator -n $Namespace

# Show deployment status
Write-Host "📊 Deployment Status:" -ForegroundColor Green
kubectl get pods -n $Namespace
kubectl get services -n $Namespace

# Show ingress status if available
if (Test-Path "ingress.yaml") {
    Write-Host "🌐 Ingress Status:" -ForegroundColor Green
    kubectl get ingress -n $Namespace
}

Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "🔗 Access your application using the ingress or service endpoints" -ForegroundColor Cyan 