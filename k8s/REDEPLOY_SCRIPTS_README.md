# Kubernetes Redeployment Scripts

This directory contains PowerShell scripts for managing the complete lifecycle of the Orchestrator application in Kubernetes, including cleaning, building, and redeploying.

## Scripts Overview

### 1. `redeploy-complete.ps1` - Complete Redeployment
**Purpose**: Full cleanup and redeployment of the entire application
**What it does**:
- Deletes ALL Kubernetes resources in the orchestrator namespace
- Cleans Docker images
- Builds new Docker images
- Pushes images to local registry
- Redeploys everything from scratch

**Usage**:
```powershell
# Full redeploy with confirmation
.\redeploy-complete.ps1

# Full redeploy without confirmation
.\redeploy-complete.ps1 -Force

# Use custom registry
.\redeploy-complete.ps1 -Registry localhost:6500

# Skip building images (use existing ones)
.\redeploy-complete.ps1 -SkipBuild

# Skip pushing to registry
.\redeploy-complete.ps1 -SkipRegistry
```

### 2. `clean-and-rebuild.ps1` - Clean and Rebuild Images
**Purpose**: Clean Docker images and rebuild them without touching Kubernetes
**What it does**:
- Removes old orchestrator Docker images
- Builds new images from source
- Pushes to local registry
- Does NOT affect Kubernetes resources

**Usage**:
```powershell
# Clean, build, and push
.\clean-and-rebuild.ps1

# Clean and build only (skip push)
.\clean-and-rebuild.ps1 -SkipPush

# Use custom registry
.\clean-and-rebuild.ps1 -Registry localhost:6500
```

### 3. `quick-redeploy.ps1` - Quick Redeploy
**Purpose**: Quickly restart deployments to pick up new images
**What it does**:
- Restarts backend and frontend deployments
- Waits for rollouts to complete
- Verifies deployment status
- Does NOT rebuild images

**Usage**:
```powershell
# Quick redeploy with confirmation
.\quick-redeploy.ps1

# Quick redeploy without confirmation
.\quick-redeploy.ps1 -Force
```

## Typical Workflow

### Scenario 1: Complete Fresh Start
When you want to completely rebuild and redeploy everything:

```powershell
# 1. Complete redeployment
.\redeploy-complete.ps1 -Force
```

### Scenario 2: Code Changes Only
When you've made code changes and want to rebuild images:

```powershell
# 1. Clean and rebuild images
.\clean-and-rebuild.ps1

# 2. Quick redeploy to pick up new images
.\quick-redeploy.ps1
```

### Scenario 3: Configuration Changes Only
When you've only changed Kubernetes manifests:

```powershell
# 1. Quick redeploy (no image rebuild needed)
.\quick-redeploy.ps1
```

## Prerequisites

Before running any script, ensure you have:

1. **kubectl** installed and configured
2. **Docker** installed and running
3. **PowerShell** (Windows) or **pwsh** (cross-platform)
4. Access to your Kubernetes cluster

## Registry Configuration

### Local Registry (Default)
The scripts use `localhost:6500` as the default registry. If no registry is running, the scripts will automatically start a local Docker registry.

### Custom Registry
To use a custom registry:

```powershell
.\redeploy-complete.ps1 -Registry localhost:6500
```

### No Registry (Local Images)
To use local images without pushing to registry:

```powershell
.\redeploy-complete.ps1 -SkipRegistry
```

## Safety Features

### Confirmation Prompts
All scripts include confirmation prompts to prevent accidental execution:
- Use `-Force` flag to skip confirmations
- Scripts will warn about destructive operations

### Error Handling
- Scripts check for prerequisites before execution
- Clear error messages for common issues
- Graceful failure handling

### Resource Cleanup
- Proper cleanup of temporary resources
- Removal of old images to prevent disk space issues

## Troubleshooting

### Common Issues

1. **kubectl not found**
   ```powershell
   # Install kubectl or add to PATH
   # Check with: kubectl version --client
   ```

2. **Docker not running**
   ```powershell
   # Start Docker Desktop or Docker daemon
   # Check with: docker version
   ```

3. **Registry connection failed**
   ```powershell
   # Script will auto-start local registry
   # Or specify custom registry: -Registry my-registry.com
   ```

4. **Build failures**
   ```powershell
   # Check Dockerfile syntax
   # Verify source code is present
   # Check disk space
   ```

5. **Deployment failures**
   ```powershell
   # Check cluster resources
   # Verify image exists in registry
   # Check pod logs: kubectl logs -n orchestrator
   ```

### Debug Commands

```powershell
# Check cluster status
kubectl cluster-info

# Check namespace
kubectl get namespaces

# Check all resources
kubectl get all -n orchestrator

# Check pod logs
kubectl logs -f deployment/backend-orchestrator -n orchestrator

# Check events
kubectl get events -n orchestrator --sort-by='.lastTimestamp'

# Check image pull secrets
kubectl get secrets -n orchestrator
```

## Script Details

### Environment Variables
Scripts use these environment variables if available:
- `DOCKER_REGISTRY` - Default registry URL
- `KUBECONFIG` - Kubernetes config path

### Logging
All scripts provide:
- Color-coded output for different message types
- Step-by-step progress indication
- Clear success/error messages
- Detailed status information

### Performance
- Parallel operations where possible
- Efficient resource cleanup
- Minimal downtime during deployments

## Best Practices

1. **Always backup** important data before major redeployments
2. **Test in staging** before production deployment
3. **Monitor resources** during deployment
4. **Use version tags** for production deployments
5. **Keep manifests** in version control
6. **Document changes** made to deployment configuration

## Support

For issues with these scripts:
1. Check the troubleshooting section above
2. Review script output for error messages
3. Verify prerequisites are met
4. Check Kubernetes cluster status
5. Review Docker and registry logs 