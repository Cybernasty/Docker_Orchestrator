# Docker Orchestrator

A comprehensive Docker container management application with a modern web interface, supporting both HTTP and HTTPS with CA-signed certificates.

## 🎯 Features

- **Container Management**: Create, start, stop, and delete Docker containers
- **Real-time Monitoring**: Live container statistics and logs
- **Web-based Terminal**: Interactive terminal access to containers
- **High Availability**: Multi-instance deployment with load balancing
- **HTTPS Support**: Full SSL/TLS encryption with CA-signed certificates
- **Kubernetes Ready**: Complete Kubernetes deployment configuration
- **Security**: JWT authentication, rate limiting, and security headers
- **Local Registry**: Built-in local Docker registry for development

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for development)
- MongoDB (included in Docker setup)

### Basic Deployment

```bash
# Clone the repository
git clone <repository-url>
cd Orchestrator

# Start the application
docker-compose up -d

# Access the application
open http://localhost
```

### Local Registry Setup (Recommended for Development)

```bash
# Setup local registry and build images
.\setup-registry.ps1

# Or rebuild images if registry already exists
.\rebuild-images.ps1
```

### HTTPS Deployment

For production use with CA-signed certificates:

```bash
# Run the HTTPS setup script
.\setup-https.ps1 -CertPath "path\to\server.crt" -KeyPath "path\to\server.key" -CaPath "path\to\ca.crt" -EnableHttps

# Deploy with HTTPS enabled
docker-compose -f docker-compose.ha.yml up -d

# Test the setup
.\test-https.ps1
```

## 📁 Project Structure

```
Orchestrator/
├── backend_orchestrator/     # Node.js backend API
├── frontend_orchestrator/    # React frontend
├── k8s/                     # Kubernetes manifests
├── nginx/                   # Nginx configuration
├── ssl/                     # SSL certificates (create this)
├── ssl-setup.md            # HTTPS setup guide
├── setup-https.ps1         # HTTPS setup script
├── setup-registry.ps1      # Local registry setup script
├── rebuild-images.ps1      # Image rebuild script
├── test-https.ps1          # HTTPS test script
└── docker-compose.yml      # Docker Compose configuration
```

## 🔒 Security Features

### HTTPS Configuration

The application supports full HTTPS with CA-signed certificates:

- **SSL/TLS 1.2/1.3** with secure cipher suites
- **HSTS headers** for enhanced security
- **OCSP stapling** for certificate validation
- **Automatic HTTP to HTTPS redirection**
- **Secure WebSocket connections (WSS)**

### Authentication & Authorization

- **JWT-based authentication**
- **Rate limiting** on API endpoints
- **CORS protection**
- **Security headers** (XSS, CSRF, etc.)

## 🐳 Deployment Options

### 1. Docker Compose (Development/Testing)

```bash
# Single instance
docker-compose up -d

# High availability with load balancing
docker-compose -f docker-compose.ha.yml up -d
```

### 2. Local Registry Development

```bash
# Setup complete development environment
.\setup-registry.ps1

# This will:
# - Start local Docker registry on port 6500
# - Build backend and frontend images
# - Push images to local registry
# - Update Kubernetes manifests
```

### 3. Kubernetes (Production)

```bash
# Setup local cluster
.\k8s\setup-local.ps1

# Deploy to Kubernetes
.\k8s\deploy.ps1
```

### 4. HTTPS with CA-Signed Certificates

See [ssl-setup.md](ssl-setup.md) for detailed instructions.

## 🔧 Configuration

### Environment Variables

Key configuration options in `.env`:

```bash
# HTTPS Configuration
HTTPS_ENABLED=true
HTTPS_PORT=5443
SSL_CERT_PATH=/etc/ssl/certs/server.crt
SSL_KEY_PATH=/etc/ssl/private/server.key
SSL_CA_PATH=/etc/ssl/certs/ca.crt

# Security
JWT_SECRET=your-secret-key
CORS_ORIGIN=https://your-domain.com

# Database
MONGO_URI=mongodb://mongo:27017/containersDB

# Registry (for local development)
REGISTRY_HOST=localhost
REGISTRY_PORT=6500
```

### Local Registry Configuration

The application includes a local Docker registry for development:

- **Registry URL**: `localhost:6500`
- **Backend Image**: `localhost:6500/orchestrator-backend:latest`
- **Frontend Image**: `localhost:6500/orchestrator-frontend:latest`

## 📊 Monitoring & Health Checks

- **Health endpoints**: `/health` for service status
- **Metrics**: Prometheus-compatible metrics
- **Logging**: Structured JSON logging
- **Docker health checks**: Automatic container monitoring

## 🔍 Troubleshooting

### Common Issues

1. **Frontend build fails**: 
   - Ensure `public` directory is not excluded in `.dockerignore`
   - Run `.\rebuild-images.ps1` to rebuild

2. **Registry connection timeout**:
   - Start local registry: `docker run -d --name local-registry -p 6500:5000 registry:2`
   - Or use `.\setup-registry.ps1`

3. **Certificate errors**: 
   - Run `.\test-https.ps1` to diagnose
   - Check certificate paths and permissions

4. **Container creation fails**: 
   - Check Docker socket permissions
   - Verify Docker daemon is running

5. **WebSocket connection issues**: 
   - Verify HTTPS/WSS configuration
   - Check firewall settings

### Debug Commands

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Test HTTPS setup
.\test-https.ps1 -Verbose

# Validate certificates
openssl x509 -in ssl/server.crt -text -noout

# Check registry status
docker ps | findstr registry
Invoke-WebRequest -Uri "http://localhost:6500/v2/_catalog"
```

### Build Issues

If you encounter build issues:

```bash
# Clean and rebuild images
.\rebuild-images.ps1

# Or manually rebuild
docker build -t localhost:6500/orchestrator-backend:latest ./backend_orchestrator
docker build -t localhost:6500/orchestrator-frontend:latest ./frontend_orchestrator
```

## 🛠️ Development

### Local Development Setup

1. **Start local registry**:
   ```bash
   .\setup-registry.ps1
   ```

2. **Build and push images**:
   ```bash
   .\rebuild-images.ps1
   ```

3. **Deploy to Kubernetes**:
   ```bash
   .\k8s\deploy.ps1
   ```

### Making Changes

1. **Backend changes**: Rebuild backend image
2. **Frontend changes**: Rebuild frontend image
3. **Configuration changes**: Update configmaps and restart pods

## 📚 Documentation

- [HTTPS Setup Guide](ssl-setup.md) - Complete HTTPS configuration
- [Kubernetes Deployment](k8s/README.md) - K8s setup and deployment
- [High Availability Guide](HA-README.md) - HA deployment options

## 🔄 Recent Updates

### v2.0.0 - HTTPS & Registry Support
- ✅ Added HTTPS support with CA-signed certificates
- ✅ Fixed frontend build issues (.dockerignore)
- ✅ Added local Docker registry setup
- ✅ Improved Kubernetes deployment
- ✅ Enhanced security configuration
- ✅ Added comprehensive testing scripts

### Build Fixes
- Fixed `.dockerignore` excluding `public` directory
- Fixed nginx user creation in Dockerfile
- Added proper error handling for existing groups

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:

1. Check the troubleshooting section
2. Review the documentation
3. Open an issue on GitHub

---

**Note**: For production deployments, always use HTTPS with properly signed certificates and change default passwords/secrets.