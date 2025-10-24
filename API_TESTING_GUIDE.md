# Docker Orchestrator API Testing Guide

## 🚀 Quick Start

### **Step 1: Access Your Backend API**

#### **Option A: Port Forward (Recommended for Testing)**
```bash
kubectl port-forward -n default svc/backend-service 5000:5000
```

#### **Option B: Get Service URL (if using LoadBalancer/NodePort)**
```bash
# For LoadBalancer
kubectl get svc -n default backend-service

# For NodePort
kubectl get svc -n default backend-service
# Access via: http://<node-ip>:<nodePort>
```

#### **Option C: Via Ingress**
```bash
# If you have ingress configured
# Access via: http://your-domain.com
```

---

## 📬 Import Postman Collection

### **Method 1: Import from File**
1. Open Postman
2. Click **Import** button (top left)
3. Select **Docker_Orchestrator_API.postman_collection.json**
4. Click **Import**

### **Method 2: Import from URL** (if hosted on GitHub)
1. Click **Import** → **Link**
2. Paste the raw GitHub URL
3. Click **Continue** → **Import**

---

## ⚙️ Configure Postman Environment

### **Set Collection Variables**
1. Click on the **Docker Orchestrator API** collection
2. Go to **Variables** tab
3. Set values:
   - `base_url`: `http://localhost:5000` (or your API URL)
   - `auth_token`: Leave empty (will be auto-filled after login)

### **OR Create an Environment**
1. Click **Environments** (left sidebar)
2. Create **New Environment**: "Docker Orchestrator Local"
3. Add variables:
   ```
   base_url = http://localhost:5000
   auth_token = (leave empty)
   ```
4. **Save** and select this environment

---

## 🔐 Authentication Flow

### **Step 1: Login**
1. Open **Authentication** → **Login** request
2. Modify the body if needed:
   ```json
   {
       "email": "admin@example.com",
       "password": "yourpassword"
   }
   ```
3. Click **Send**
4. ✅ The auth token will be **automatically saved** to `{{auth_token}}`

### **Step 2: Test Authenticated Endpoints**
All other requests will now use the token automatically via Bearer authentication!

---

## 📋 API Endpoints Reference

### **Authentication Endpoints**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | Login user | ❌ |
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/add-user` | Add user (Admin) | ✅ Admin |
| GET | `/api/auth/users` | Get all users | ✅ Admin |
| PUT | `/api/auth/users/:userId` | Update user | ✅ Admin |
| DELETE | `/api/auth/users/:userId` | Delete user | ✅ Admin |

### **Container Endpoints**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/containers` | Get all containers | ✅ All roles |
| GET | `/api/containers/:id` | Get container by ID | ✅ All roles |
| GET | `/api/containers/:id/logs` | Get container logs | ✅ All roles |
| GET | `/api/containers/:id/stats` | Get container stats | ✅ All roles |
| POST | `/api/containers/:id/start` | Start container | ✅ Admin/Operator |
| POST | `/api/containers/:id/stop` | Stop container | ✅ Admin/Operator |
| DELETE | `/api/containers/:id` | Remove container | ✅ Admin/Operator |
| POST | `/api/containers/:id/exec` | Execute command | ✅ Admin/Operator |
| GET | `/api/containers/sync` | Sync containers to DB | ✅ Admin |

### **Image Endpoints**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/containers/images` | Get all images | ✅ All roles |
| POST | `/api/containers/build-image` | Build image from Dockerfile | ✅ Admin/Operator |
| POST | `/api/containers/create` | Create container from image | ✅ Admin/Operator |
| POST | `/api/containers/build-and-create` | Build & create container | ✅ Admin/Operator |

---

## 🧪 Testing Workflow

### **1. Basic Testing Flow**
```
1. Login → Get auth token
2. Get All Containers → Check response
3. Get Container by ID → Use real container ID
4. Get Container Stats → Monitor resources
5. Start/Stop Container → Test lifecycle
```

### **2. Create Container Flow**
```
1. Get All Images → Check available images
2. Create Container from Image → Use real image name
3. Get Container by ID → Verify creation
4. Start Container → Make it running
5. Get Container Logs → Check output
```

### **3. Build Custom Image Flow**
```
1. Build Image from Dockerfile → Create custom image
2. Get All Images → Verify image exists
3. Create Container from Image → Deploy it
4. Get Container Stats → Monitor performance
```

---

## 🔍 Testing with OWASP ZAP

### **Option 1: Manual Proxy Setup**

1. **Start ZAP** (ensure ZAP pod is running):
   ```bash
   kubectl port-forward -n zap svc/zap-service 8080:8080
   ```

2. **Configure Postman Proxy**:
   - Settings → Proxy → Add proxy server
   - Proxy Type: HTTP
   - Proxy Server: `localhost:8080`
   - Enable proxy for this request

3. **Run Requests** through ZAP:
   - All requests will be captured by ZAP
   - ZAP will analyze for vulnerabilities

4. **View Results** in ZAP:
   - Open `http://localhost:8080` (ZAP UI)
   - Check **Alerts** tab for findings

### **Option 2: ZAP API Automated Scan**

Create a script to scan your API:

```bash
# Spider the API
curl "http://localhost:8080/JSON/spider/action/scan/?url=http://backend-service:5000"

# Active scan
curl "http://localhost:8080/JSON/ascan/action/scan/?url=http://backend-service:5000"

# Get alerts
curl "http://localhost:8080/JSON/alert/view/alerts/"
```

---

## 📊 Sample Test Scenarios

### **Scenario 1: Full Container Lifecycle**
1. **Login** as admin
2. **Get All Containers** (verify list)
3. **Create New Container**:
   ```json
   {
       "imageName": "nginx:alpine",
       "containerName": "test-nginx",
       "ports": [{"host": "8081", "container": "80"}]
   }
   ```
4. **Start Container**
5. **Get Container Stats** (check CPU/Memory)
6. **Get Container Logs**
7. **Stop Container**
8. **Remove Container**

### **Scenario 2: User Management (Admin Only)**
1. **Login** as admin
2. **Get All Users**
3. **Add New User** (operator role)
4. **Update User** (change to viewer)
5. **Delete User**

### **Scenario 3: Image Building**
1. **Build Custom Image**:
   ```json
   {
       "dockerfileContent": "FROM alpine:latest\nRUN apk add --no-cache curl\nCMD [\"sh\"]",
       "imageName": "my-alpine",
       "tag": "v1.0"
   }
   ```
2. **Verify Image** in image list
3. **Create Container** from built image
4. **Execute Command** in container

---

## 🛠️ Troubleshooting

### **Issue: 401 Unauthorized**
- **Solution**: Login first and ensure token is saved
- Check: `{{auth_token}}` variable has value

### **Issue: Cannot connect to API**
- **Solution**: Verify port-forward is active
  ```bash
  kubectl port-forward -n default svc/backend-service 5000:5000
  ```

### **Issue: Container ID not found**
- **Solution**: Get real container IDs first
  ```bash
  # Run "Get All Containers" request
  # Copy actual container ID from response
  ```

### **Issue: Permission Denied**
- **Solution**: Check user role
  - Some endpoints require **admin** or **operator** role
  - **viewer** role can only read data

---

## 📈 Advanced Testing

### **Load Testing with Newman (Postman CLI)**
```bash
# Install Newman
npm install -g newman

# Run collection
newman run Docker_Orchestrator_API.postman_collection.json \
  --environment your-environment.json \
  --iteration-count 10

# Generate HTML report
newman run Docker_Orchestrator_API.postman_collection.json \
  --reporters cli,html \
  --reporter-html-export report.html
```

### **Automated Testing in CI/CD**
```yaml
# .github/workflows/api-test.yml
- name: Run API Tests
  run: |
    newman run Docker_Orchestrator_API.postman_collection.json \
      --env-var "base_url=${{ secrets.API_URL }}" \
      --bail
```

---

## 🎯 Quick Reference

### **Common cURL Equivalents**

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

**Get Containers (with auth):**
```bash
curl -X GET http://localhost:5000/api/containers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Start Container:**
```bash
curl -X POST http://localhost:5000/api/containers/CONTAINER_ID/start \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📝 Notes

- **Default Port**: Backend runs on `5000`
- **Auth Token**: Valid for duration specified in `JWT_EXPIRES_IN`
- **CORS**: Enabled for frontend communication
- **Rate Limiting**: May be configured (check with admin)
- **API Version**: Check `/api/health` for version info

---

## ✅ Testing Checklist

- [ ] Port-forward to backend service active
- [ ] Postman collection imported
- [ ] Environment variables configured
- [ ] Successfully logged in
- [ ] Auth token saved automatically
- [ ] Tested read operations (GET)
- [ ] Tested write operations (POST/PUT/DELETE)
- [ ] Tested with different user roles
- [ ] Checked error responses
- [ ] Tested with invalid data
- [ ] Documented any issues found

---

**Happy Testing! 🚀**


