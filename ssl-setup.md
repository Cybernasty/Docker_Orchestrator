# HTTPS Setup with CA-Signed Certificates

This guide explains how to configure your Docker Orchestrator application to use HTTPS with certificates signed by your lab's Certificate Authority (CA).

## 🎯 Overview

The application now supports HTTPS with CA-signed certificates for both Docker Compose and Kubernetes deployments. This provides:

- **End-to-end encryption** for all communications
- **CA-signed certificates** for trusted identity verification
- **Automatic HTTP to HTTPS redirection**
- **Secure WebSocket connections** for terminal functionality
- **HSTS headers** for enhanced security

## 📁 Certificate Structure

Your SSL certificates should be organized as follows:

```
ssl/
├── server.crt          # Your server certificate
├── server.key          # Your private key
└── ca.crt             # Your CA certificate
```

## 🔧 Setup Instructions

### Step 1: Prepare Your Certificates

1. **Obtain certificates from your lab CA:**
   ```bash
   # Request a certificate from your CA
   # You'll need to provide:
   # - Common Name (CN): your server's hostname
   # - Subject Alternative Names (SANs): additional hostnames/IPs
   # - Key size: 2048 bits minimum (4096 recommended)
   ```

2. **Organize your certificates:**
   ```bash
   mkdir -p ssl
   cp /path/to/your/server.crt ssl/
   cp /path/to/your/server.key ssl/
   cp /path/to/your/ca.crt ssl/
   
   # Set proper permissions
   chmod 644 ssl/server.crt ssl/ca.crt
   chmod 600 ssl/server.key
   ```

### Step 2: Docker Compose Deployment

1. **Create environment file:**
   ```bash
   cp backend_orchestrator/env.example .env
   ```

2. **Configure HTTPS in `.env`:**
   ```bash
   # Enable HTTPS
   HTTPS_ENABLED=true
   HTTPS_PORT=5443
   
   # Certificate paths (relative to ssl/ directory)
   SSL_CERT_PATH=/etc/ssl/certs/server.crt
   SSL_KEY_PATH=/etc/ssl/private/server.key
   SSL_CA_PATH=/etc/ssl/certs/ca.crt
   
   # Optional: SSL passphrase if your key is encrypted
   SSL_PASSPHRASE=your-passphrase-here
   ```

3. **Deploy with HTTPS:**
   ```bash
   # For high availability
   docker-compose -f docker-compose.ha.yml up -d
   
   # For single instance
   docker-compose up -d
   ```

4. **Verify HTTPS is working:**
   ```bash
   # Check nginx logs
   docker-compose logs nginx
   
   # Test HTTPS endpoint
   curl -k https://localhost/health
   
   # Test with CA verification
   curl --cacert ssl/ca.crt https://localhost/health
   ```

### Step 3: Kubernetes Deployment

1. **Encode your certificates:**
   ```bash
   # Encode certificates for Kubernetes secrets
   cat ssl/server.crt | base64 -w 0
   cat ssl/server.key | base64 -w 0
   cat ssl/ca.crt | base64 -w 0
   ```

2. **Update Kubernetes secrets:**
   ```bash
   # Edit k8s/secrets.yaml and replace the base64 encoded values
   # with your actual certificate data
   ```

3. **Deploy to Kubernetes:**
   ```bash
   # Apply secrets first
   kubectl apply -f k8s/secrets.yaml
   
   # Apply all other resources
   kubectl apply -f k8s/
   ```

4. **Verify deployment:**
   ```bash
   # Check pods are running
   kubectl get pods -n orchestrator
   
   # Check services
   kubectl get svc -n orchestrator
   
   # Test HTTPS endpoint
   kubectl port-forward svc/frontend-orchestrator 443:80 -n orchestrator
   curl -k https://localhost/health
   ```

## 🔒 Security Configuration

### SSL/TLS Settings

The application uses secure SSL/TLS configuration:

- **Protocols:** TLSv1.2, TLSv1.3
- **Ciphers:** ECDHE-RSA-AES128-GCM-SHA256, ECDHE-RSA-AES256-GCM-SHA384, ECDHE-RSA-CHACHA20-POLY1305
- **Session cache:** 10 minutes
- **OCSP stapling:** Enabled
- **HSTS:** max-age=31536000; includeSubDomains; preload

### Security Headers

The following security headers are automatically added:

- `Strict-Transport-Security`: Forces HTTPS
- `X-Frame-Options`: Prevents clickjacking
- `X-Content-Type-Options`: Prevents MIME sniffing
- `X-XSS-Protection`: XSS protection
- `Content-Security-Policy`: Resource loading restrictions

## 🌐 Frontend Configuration

### CORS Settings

Update your frontend configuration to use HTTPS:

```javascript
// In your frontend API calls
const API_BASE_URL = 'https://your-domain.com/api';
```

### WebSocket Connections

WebSocket connections automatically use WSS (secure WebSocket) when HTTPS is enabled:

```javascript
// Frontend WebSocket connection
const ws = new WebSocket(`wss://your-domain.com/api/terminal?token=${token}`);
```

## 🔍 Troubleshooting

### Common Issues

1. **Certificate not found:**
   ```bash
   # Check certificate paths
   docker exec -it <container> ls -la /etc/ssl/certs/
   docker exec -it <container> ls -la /etc/ssl/private/
   ```

2. **Permission denied:**
   ```bash
   # Fix certificate permissions
   chmod 644 ssl/*.crt
   chmod 600 ssl/*.key
   ```

3. **SSL handshake failed:**
   ```bash
   # Check certificate validity
   openssl x509 -in ssl/server.crt -text -noout
   
   # Verify certificate chain
   openssl verify -CAfile ssl/ca.crt ssl/server.crt
   ```

4. **Nginx SSL errors:**
   ```bash
   # Check nginx configuration
   docker exec -it <nginx-container> nginx -t
   
   # View nginx error logs
   docker logs <nginx-container>
   ```

### Debug Commands

```bash
# Test SSL certificate
openssl s_client -connect localhost:443 -servername localhost

# Check certificate chain
openssl verify -CAfile ssl/ca.crt ssl/server.crt

# View certificate details
openssl x509 -in ssl/server.crt -text -noout

# Test HTTPS endpoint
curl -v --cacert ssl/ca.crt https://localhost/health
```

## 🔄 Certificate Renewal

### Automated Renewal

For production environments, set up automated certificate renewal:

1. **Create renewal script:**
   ```bash
   #!/bin/bash
   # renew-certs.sh
   
   # Download new certificates from CA
   # Update Kubernetes secrets
   kubectl create secret generic ssl-certificates \
     --from-file=server.crt=ssl/server.crt \
     --from-file=server.key=ssl/server.key \
     --from-file=ca.crt=ssl/ca.crt \
     --dry-run=client -o yaml | kubectl apply -f -
   
   # Restart pods to pick up new certificates
   kubectl rollout restart statefulset/backend-orchestrator -n orchestrator
   ```

2. **Set up cron job:**
   ```bash
   # Add to crontab
   0 2 * * 1 /path/to/renew-certs.sh
   ```

### Manual Renewal

1. **Obtain new certificates from CA**
2. **Update certificate files**
3. **Restart services:**
   ```bash
   # Docker Compose
   docker-compose restart nginx backend1 backend2
   
   # Kubernetes
   kubectl rollout restart statefulset/backend-orchestrator -n orchestrator
   ```

## 📋 Checklist

- [ ] CA-signed certificates obtained
- [ ] Certificates placed in `ssl/` directory
- [ ] Proper permissions set (644 for .crt, 600 for .key)
- [ ] Environment variables configured
- [ ] Docker Compose or Kubernetes deployment updated
- [ ] HTTPS endpoints tested
- [ ] WebSocket connections verified
- [ ] Security headers confirmed
- [ ] Certificate renewal process documented

## 🚀 Next Steps

After setting up HTTPS:

1. **Update DNS records** to point to your HTTPS endpoint
2. **Configure monitoring** to check certificate expiration
3. **Set up alerts** for certificate renewal
4. **Test all functionality** with HTTPS enabled
5. **Document the setup** for your team

## 📚 Additional Resources

- [Nginx SSL Configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [Node.js HTTPS](https://nodejs.org/api/https.html)
- [OpenSSL Documentation](https://www.openssl.org/docs/)
- [SSL Labs SSL Test](https://www.ssllabs.com/ssltest/) 