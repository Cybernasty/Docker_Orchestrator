# Single Command Deployment

Deploy the complete Orchestrator application to Kubernetes with a single command, pointing to Ubuntu Docker daemon at `192.168.11.149`.

## Prerequisites

1. **Kubernetes cluster** running and accessible via `kubectl`
2. **Docker** installed and configured
3. **Docker Hub access** (for pushing images)
4. **Ubuntu Docker daemon** running on `192.168.11.149:2375` with root access

## Ubuntu Docker Daemon Setup

Make sure your Ubuntu machine (`192.168.11.149`) has Docker daemon configured to accept TCP connections:

```bash
# On Ubuntu machine (192.168.11.149)
sudo systemctl edit docker
```

Add the following override:
```ini
[Service]
ExecStart=
ExecStart=/usr/bin/dockerd -H unix:///var/run/docker.sock -H tcp://0.0.0.0:2375
```

Then restart Docker:
```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
```

Verify it's running:
```bash
curl http://localhost:2375/version
```

## Deployment Options

### Option 1: PowerShell (Windows)

```powershell
# Full deployment (builds and pushes images)
.\deploy-single-command.ps1

# Skip building images (use existing ones)
.\deploy-single-command.ps1 -SkipBuild

# Force deployment
.\deploy-single-command.ps1 -Force
```

### Option 2: Bash (Linux/macOS)

```bash
# Full deployment (builds and pushes images)
./deploy-single-command.sh

# Skip building images (use existing ones)
./deploy-single-command.sh --skip-build

# Force deployment
./deploy-single-command.sh --force
```

## What the Script Does

1. **Creates namespace** `orchestrator`
2. **Builds and pushes** Docker images to Docker Hub (`cybermonta/orchestrator-backend:latest`, `cybermonta/orchestrator-frontend:latest`)
3. **Applies ConfigMap** with Ubuntu Docker daemon configuration (`tcp://192.168.11.149:2375`)
4. **Creates secrets** for JWT and SSL
5. **Deploys MongoDB** StatefulSet and service
6. **Deploys Backend** StatefulSet (3 replicas)
7. **Deploys Frontend** Deployment (3 replicas)
8. **Deploys Services** (NodePort for external access)
9. **Waits** for all deployments to be ready
10. **Tests connectivity** to Ubuntu Docker daemon
11. **Displays access URLs** and useful commands

## Application Access

After successful deployment:

- **Frontend**: `http://<kubernetes-node-ip>:30080`
- **Backend**: `http://<kubernetes-node-ip>:30050`

## Configuration

The application is configured to:
- **Connect to Ubuntu Docker daemon**: `tcp://192.168.11.149:2375`
- **Use MongoDB Atlas**: Cloud-hosted MongoDB
- **Run with root access**: For Docker socket access
- **Enable CORS**: For cross-origin requests

## Useful Commands

```bash
# Check deployment status
kubectl get pods -n orchestrator
kubectl get services -n orchestrator

# View logs
kubectl logs -f deployment/frontend-orchestrator -n orchestrator
kubectl logs -f statefulset/backend-orchestrator -n orchestrator

# Port forward for local access
kubectl port-forward svc/frontend-orchestrator-nodeport 8080:80 -n orchestrator

# Test Ubuntu Docker daemon connectivity
kubectl run docker-test --image=curlimages/curl --rm -i --restart=Never -- \
  curl -s http://192.168.11.149:2375/version
```

## Troubleshooting

### Docker Daemon Connection Issues

If the application can't connect to the Ubuntu Docker daemon:

1. **Check Ubuntu Docker daemon**:
   ```bash
   # On Ubuntu machine
   sudo systemctl status docker
   curl http://localhost:2375/version
   ```

2. **Check network connectivity**:
   ```bash
   # From Kubernetes cluster
   kubectl run network-test --image=curlimages/curl --rm -i --restart=Never -- \
     curl -s http://192.168.11.149:2375/version
   ```

3. **Check firewall**:
   ```bash
   # On Ubuntu machine
   sudo ufw status
   sudo ufw allow 2375/tcp
   ```

### Image Pull Issues

If images can't be pulled from Docker Hub:

1. **Check Docker Hub access**:
   ```bash
   docker login -u cybermonta
   docker pull cybermonta/orchestrator-backend:latest
   ```

2. **Rebuild and push**:
   ```bash
   docker build -t cybermonta/orchestrator-backend:latest ../backend_orchestrator
   docker push cybermonta/orchestrator-backend:latest
   ```

## Cleanup

To remove all resources:

```bash
kubectl delete namespace orchestrator
```




