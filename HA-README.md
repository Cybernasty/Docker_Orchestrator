# High Availability Deployment Guide

This guide explains how to deploy your Docker Orchestrator application with high availability using multiple instances and load balancing.

## 🎯 Overview

High availability ensures your application remains accessible even if individual components fail. This setup includes:

- **Multiple Backend Instances**: 2+ backend servers for redundancy
- **Load Balancer**: Nginx distributes traffic across instances
- **Database Redundancy**: MongoDB replica set for data persistence
- **Session Management**: Redis for shared session storage
- **Health Checks**: Automatic failure detection and recovery
- **Auto-scaling**: Kubernetes HPA for dynamic scaling

## 🚀 Deployment Options

### Option 1: Docker Compose (Recommended for Development/Testing)

#### Prerequisites
- Docker
- Docker Compose

#### Quick Start
```bash
# Make script executable
chmod +x deploy-ha.sh

# Deploy with high availability
./deploy-ha.sh
```

#### Manual Deployment
```bash
# Build and start services
docker-compose -f docker-compose.ha.yml up -d

# Check status
docker-compose -f docker-compose.ha.yml ps

# View logs
docker-compose -f docker-compose.ha.yml logs -f
```

### Option 2: Kubernetes (Recommended for Production)

#### Prerequisites
- Kubernetes cluster (minikube, kind, or cloud provider)
- kubectl
- nginx-ingress controller
- metrics-server (for HPA)

#### Quick Start
```bash
# Make script executable
chmod +x k8s/deploy-k8s.sh

# Deploy to Kubernetes
./k8s/deploy-k8s.sh
```

#### Manual Deployment
```bash
# Apply all manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n orchestrator
kubectl get services -n orchestrator
```

## 📊 Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Load Balancer │
│   (Nginx)       │    │   (Ingress)     │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
    ┌─────▼─────┐          ┌─────▼─────┐
    │ Frontend  │          │ Frontend  │
    │ (Single)  │          │ (Multiple)│
    └─────┬─────┘          └─────┬─────┘
          │                      │
    ┌─────▼─────┐          ┌─────▼─────┐
    │ Backend 1 │          │ Backend 1 │
    │ Backend 2 │          │ Backend 2 │
    └─────┬─────┘          │ Backend N │
          │                └─────┬─────┘
    ┌─────▼─────┐                │
    │ MongoDB   │          ┌─────▼─────┐
    │ (Replica) │          │ MongoDB   │
    └───────────┘          │ (Replica) │
                           └───────────┘
```

## 🔧 Configuration

### Load Balancer Settings

#### Nginx Configuration (`nginx/nginx.conf`)
- **Load Balancing**: Round-robin (default)
- **Health Checks**: Automatic failure detection
- **Rate Limiting**: API protection
- **SSL Support**: HTTPS configuration ready
- **WebSocket Support**: Terminal functionality

#### Alternative Load Balancing Methods
```nginx
# Least connections
upstream backend_servers {
    least_conn;
    server backend1:5000;
    server backend2:5000;
}

# IP hash (session affinity)
upstream backend_servers {
    ip_hash;
    server backend1:5000;
    server backend2:5000;
}
```

### Kubernetes Configuration

#### Horizontal Pod Autoscaler
- **Backend**: 2-10 replicas based on CPU/memory
- **Frontend**: 2-5 replicas based on CPU/memory
- **Scaling**: Automatic based on resource usage

#### Resource Limits
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

## 🔍 Monitoring and Health Checks

### Health Check Endpoints
- **Backend**: `GET /health`
- **Frontend**: `GET /health`
- **Load Balancer**: `GET /health`

### Monitoring Commands

#### Docker Compose
```bash
# Check service health
docker-compose -f docker-compose.ha.yml ps

# View logs
docker-compose -f docker-compose.ha.yml logs -f backend1
docker-compose -f docker-compose.ha.yml logs -f backend2

# Monitor resource usage
docker stats
```

#### Kubernetes
```bash
# Check pod status
kubectl get pods -n orchestrator

# View logs
kubectl logs -f deployment/orchestrator-backend -n orchestrator

# Monitor HPA
kubectl get hpa -n orchestrator

# Check resource usage
kubectl top pods -n orchestrator
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Load Balancer Not Routing Traffic
```bash
# Check nginx configuration
docker-compose -f docker-compose.ha.yml exec nginx nginx -t

# Check backend health
curl http://localhost/health
```

#### 2. Backend Instances Not Starting
```bash
# Check logs
docker-compose -f docker-compose.ha.yml logs backend1
docker-compose -f docker-compose.ha.yml logs backend2

# Check Docker socket access
docker-compose -f docker-compose.ha.yml exec backend1 ls -la /var/run/docker.sock
```

#### 3. MongoDB Connection Issues
```bash
# Check MongoDB status
docker-compose -f docker-compose.ha.yml exec mongo mongosh --eval "rs.status()"

# Check replica set
docker-compose -f docker-compose.ha.yml exec mongo mongosh --eval "rs.conf()"
```

### Performance Optimization

#### 1. Database Optimization
```javascript
// MongoDB indexes for better performance
db.containers.createIndex({ "name": 1 });
db.users.createIndex({ "email": 1 });
db.logs.createIndex({ "timestamp": -1 });
```

#### 2. Caching Strategy
```javascript
// Redis caching for frequently accessed data
const cacheKey = `container:${containerId}`;
const cachedData = await redis.get(cacheKey);
if (!cachedData) {
    const data = await getContainerData(containerId);
    await redis.setex(cacheKey, 300, JSON.stringify(data)); // 5 minutes
}
```

## 🔒 Security Considerations

### 1. Secrets Management
- Use Kubernetes secrets or Docker secrets
- Never commit sensitive data to version control
- Rotate JWT secrets regularly

### 2. Network Security
- Use HTTPS in production
- Implement proper firewall rules
- Restrict Docker socket access

### 3. Access Control
- Implement proper RBAC
- Use strong authentication
- Monitor access logs

## 📈 Scaling Strategies

### Vertical Scaling
- Increase CPU/memory limits
- Optimize application code
- Use more powerful hardware

### Horizontal Scaling
- Add more backend instances
- Use database sharding
- Implement microservices architecture

### Auto-scaling Triggers
- CPU usage > 70%
- Memory usage > 80%
- Custom metrics (request rate, response time)

## 🚨 Disaster Recovery

### Backup Strategy
```bash
# MongoDB backup
docker-compose -f docker-compose.ha.yml exec mongo mongodump --out /backup

# Application data backup
docker-compose -f docker-compose.ha.yml exec backend1 tar -czf /backup/app-data.tar.gz /app/data
```

### Recovery Procedures
1. **Database Recovery**: Restore from backup
2. **Application Recovery**: Redeploy from images
3. **Configuration Recovery**: Restore config files

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review application logs
3. Verify configuration files
4. Test individual components

## 🔄 Updates and Maintenance

### Rolling Updates
```bash
# Docker Compose
docker-compose -f docker-compose.ha.yml pull
docker-compose -f docker-compose.ha.yml up -d

# Kubernetes
kubectl set image deployment/orchestrator-backend backend=orchestrator-backend:v2 -n orchestrator
```

### Zero-Downtime Deployment
- Use rolling update strategy
- Implement health checks
- Test in staging environment first 