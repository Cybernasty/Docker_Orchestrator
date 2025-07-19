Write-Host "Setting up NGINX Ingress Controller for single URL access..." -ForegroundColor Yellow

# Install NGINX Ingress Controller
Write-Host "Installing NGINX Ingress Controller..." -ForegroundColor Cyan
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml

# Wait for ingress controller to be ready
Write-Host "Waiting for ingress controller to be ready..." -ForegroundColor Cyan
kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=120s

# Create a simple ingress without SSL
Write-Host "Creating simple ingress configuration..." -ForegroundColor Cyan
$ingressYaml = @"
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: orchestrator-simple-ingress
  namespace: orchestrator
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "300"
spec:
  ingressClassName: nginx
  rules:
  - host: orchestrator.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-orchestrator
            port:
              number: 80
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend-orchestrator
            port:
              number: 5000
"@

$ingressYaml | kubectl apply -f -

Write-Host "Ingress controller setup complete!" -ForegroundColor Green
Write-Host "Add this line to your hosts file (C:\Windows\System32\drivers\etc\hosts):" -ForegroundColor Yellow
Write-Host "127.0.0.1 orchestrator.local" -ForegroundColor Cyan
Write-Host "Then access your application at: http://orchestrator.local" -ForegroundColor Green 