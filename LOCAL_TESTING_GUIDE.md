# Local Testing Guide - Docker Orchestrator API

## 🚀 Quick Start for Local Testing

### **Prerequisites**
- ✅ Node.js (v16+)
- ✅ MongoDB (running locally or MongoDB Atlas)
- ✅ Docker Desktop (for Windows/Mac) or Docker Engine (for Linux)
- ✅ Postman

---

## 📋 Step-by-Step Setup

### **Step 1: Set Up Environment Variables**

Create a `.env` file in the `backend_orchestrator` directory:

```bash
cd backend_orchestrator
cp env.example .env
```

Edit `.env` file with your local configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGO_URI=mongodb://localhost:27017/containersDB

# CORS Configuration (for React frontend)
CORS_ORIGIN=http://localhost:3000

# Docker Configuration
# For Windows:
DOCKER_SOCKET=//./pipe/docker_engine
# For Linux/Mac:
# DOCKER_SOCKET=/var/run/docker.sock

# Security Configuration
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=24h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Container Sync Interval
SYNC_INTERVAL=30000
```

### **Step 2: Start MongoDB Locally**

#### **Option A: Using MongoDB Community Edition**
```bash
# Start MongoDB service
# Windows:
net start MongoDB

# Mac:
brew services start mongodb-community

# Linux:
sudo systemctl start mongod
```

#### **Option B: Using Docker**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### **Option C: MongoDB Atlas (Cloud)**
Update `.env`:
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/containersDB
```

### **Step 3: Verify Docker is Running**

```bash
# Check Docker status
docker ps

# You should see Docker is running
```

### **Step 4: Install Backend Dependencies**

```bash
cd backend_orchestrator
npm install
```

### **Step 5: Start the Backend Server**

```bash
# Development mode (with auto-reload)
npm run dev

# OR production mode
npm start
```

You should see:
```
🔗 Connected to MongoDB
🚀 Server is running on port 5000
🔗 WebSocket using Docker socket: //./pipe/docker_engine
```

---

## 🧪 Test with Postman

### **Step 1: Import Collection**
1. Open Postman
2. Click **Import**
3. Select `Docker_Orchestrator_API.postman_collection.json`

### **Step 2: Update Base URL**
The collection is already configured for local testing!
- Base URL: `http://localhost:5000` ✅

### **Step 3: Test Authentication**

**First, create an admin user:**

You have two options:

#### **Option A: Use MongoDB Compass or CLI**
```javascript
// Connect to MongoDB and insert a user
db.users.insertOne({
  email: "admin@example.com",
  password: "$2b$10$X8k5ZYvJ9Y7rV4mQp8tKEe.QdXK0XxQYvH7YmF2JpvF.ZZ5Y8z8Dy", // "password123"
  role: "admin",
  createdAt: new Date()
})
```

#### **Option B: Use Register Endpoint**
1. Open Postman → **Authentication** → **Register**
2. Send request:
```json
{
    "email": "admin@example.com",
    "password": "password123"
}
```
3. Then manually update role in MongoDB to "admin"

#### **Now Login:**
1. Open **Authentication** → **Login**
2. Body:
```json
{
    "email": "admin@example.com",
    "password": "password123"
}
```
3. Click **Send**
4. ✅ Token auto-saved to `{{auth_token}}`

### **Step 4: Test Container Endpoints**

**Get All Containers:**
- Request: **Containers** → **Get All Containers**
- Click **Send**
- Should return list of Docker containers running on your machine

**Get Container Stats:**
- Get a container ID from previous response
- Request: **Containers** → **Get Container Stats**
- Update `:containerId` variable
- Click **Send**

---

## 🐳 Local Docker Containers for Testing

### **Create Test Containers**

```bash
# Create a simple nginx container
docker run -d --name test-nginx -p 8080:80 nginx:alpine

# Create a simple redis container  
docker run -d --name test-redis -p 6379:6379 redis:alpine

# Create a simple postgres container
docker run -d --name test-postgres -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:alpine
```

Now you'll have containers to manage via the API!

---

## 🔧 Common Local Testing Scenarios

### **Scenario 1: Container Lifecycle Management**

1. **Get All Containers**
   ```
   GET http://localhost:5000/api/containers
   ```

2. **Start a Container**
   ```
   POST http://localhost:5000/api/containers/CONTAINER_ID/start
   ```

3. **Get Container Logs**
   ```
   GET http://localhost:5000/api/containers/CONTAINER_ID/logs?tail=50
   ```

4. **Stop Container**
   ```
   POST http://localhost:5000/api/containers/CONTAINER_ID/stop
   ```

### **Scenario 2: Create Custom Container**

1. **Get Available Images**
   ```
   GET http://localhost:5000/api/containers/images
   ```

2. **Create Container from Image**
   ```json
   POST http://localhost:5000/api/containers/create
   {
       "imageName": "nginx:alpine",
       "containerName": "my-custom-nginx",
       "ports": [
           {
               "host": "8081",
               "container": "80"
           }
       ],
       "environment": [
           {
               "key": "MY_ENV_VAR",
               "value": "test_value"
           }
       ]
   }
   ```

### **Scenario 3: Execute Commands**

```json
POST http://localhost:5000/api/containers/CONTAINER_ID/exec
{
    "command": "ls -la"
}
```

---

## 🛠️ Troubleshooting

### **Issue: Cannot connect to MongoDB**

**Error:** `MongooseError: connect ECONNREFUSED`

**Solutions:**
1. **Check MongoDB is running:**
   ```bash
   # Windows
   net start MongoDB
   
   # Mac/Linux
   sudo systemctl status mongod
   ```

2. **Use Docker MongoDB:**
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

3. **Use MongoDB Atlas** (cloud):
   - Update `MONGO_URI` in `.env` to your Atlas connection string

---

### **Issue: Cannot connect to Docker**

**Error:** `Error: connect ENOENT //./pipe/docker_engine`

**Solutions:**

1. **Verify Docker Desktop is running** (Windows/Mac)

2. **Check Docker Socket Path:**
   - **Windows:** `//./pipe/docker_engine`
   - **Linux/Mac:** `/var/run/docker.sock`

3. **Test Docker CLI:**
   ```bash
   docker ps
   ```
   If this works, Docker is fine.

4. **Update `.env`:**
   ```env
   # Windows
   DOCKER_SOCKET=//./pipe/docker_engine
   
   # Linux/Mac
   DOCKER_SOCKET=/var/run/docker.sock
   ```

---

### **Issue: Port 5000 already in use**

**Error:** `EADDRINUSE: address already in use :::5000`

**Solutions:**

1. **Kill process using port 5000:**
   ```bash
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   
   # Mac/Linux
   lsof -ti:5000 | xargs kill -9
   ```

2. **Use different port:**
   Update `.env`:
   ```env
   PORT=5001
   ```
   Update Postman `base_url`: `http://localhost:5001`

---

### **Issue: CORS Error in Browser**

**Error:** `Access-Control-Allow-Origin`

**Solution:**
Update `.env`:
```env
CORS_ORIGIN=http://localhost:3000
```

Or allow all origins (development only):
```env
CORS_ORIGIN=*
```

---

### **Issue: 401 Unauthorized**

**Solutions:**

1. **Login first** in Postman
2. **Check token is saved** - Look for `{{auth_token}}` in collection variables
3. **Token expired** - Login again to get new token
4. **Check JWT_SECRET** matches in `.env`

---

## 🧪 Testing with Local ZAP (Optional)

### **Run ZAP Locally with Docker**

```bash
# Run OWASP ZAP
docker run -d -p 8080:8080 --name zap ghcr.io/zaproxy/zaproxy:stable \
  zap.sh -daemon -host 0.0.0.0 -port 8080 -config api.disablekey=true
```

### **Configure Postman to use ZAP Proxy**
1. Postman Settings → Proxy
2. Add proxy: `http://localhost:8080`
3. Enable proxy
4. All requests will be scanned by ZAP!

### **View ZAP Results**
Open browser: `http://localhost:8080` (ZAP UI)

---

## 📊 Test Data Setup

### **Create Test User via MongoDB**

```bash
# Connect to MongoDB
mongosh containersDB

# Create admin user
db.users.insertOne({
  email: "admin@test.com",
  password: "$2b$10$X8k5ZYvJ9Y7rV4mQp8tKEe.QdXK0XxQYvH7YmF2JpvF.ZZ5Y8z8Dy", // password123
  role: "admin",
  createdAt: new Date()
})

# Create operator user
db.users.insertOne({
  email: "operator@test.com",
  password: "$2b$10$X8k5ZYvJ9Y7rV4mQp8tKEe.QdXK0XxQYvH7YmF2JpvF.ZZ5Y8z8Dy", // password123
  role: "operator",
  createdAt: new Date()
})

# Create viewer user
db.users.insertOne({
  email: "viewer@test.com",
  password: "$2b$10$X8k5ZYvJ9Y7rV4mQp8tKEe.QdXK0XxQYvH7YmF2JpvF.ZZ5Y8z8Dy", // password123
  role: "viewer",
  createdAt: new Date()
})
```

---

## ✅ Local Testing Checklist

- [ ] Node.js installed
- [ ] MongoDB running locally (or using Atlas)
- [ ] Docker Desktop/Engine running
- [ ] `.env` file created and configured
- [ ] Backend dependencies installed (`npm install`)
- [ ] Backend server running (`npm run dev`)
- [ ] Server accessible at `http://localhost:5000`
- [ ] Postman collection imported
- [ ] Successfully logged in via Postman
- [ ] Auth token auto-saved
- [ ] Tested container endpoints
- [ ] Created test containers for testing

---

## 🎯 Quick Commands Reference

```bash
# Start MongoDB (Docker)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Start Backend
cd backend_orchestrator
npm run dev

# Create test containers
docker run -d --name test-nginx -p 8080:80 nginx:alpine
docker run -d --name test-redis -p 6379:6379 redis:alpine

# Check running containers
docker ps

# View backend logs
# (logs appear in terminal where you ran npm run dev)

# Stop everything
docker stop test-nginx test-redis mongodb
docker rm test-nginx test-redis mongodb
```

---

## 📝 Environment Variables Summary

| Variable | Local Value | Description |
|----------|-------------|-------------|
| `PORT` | `5000` | Backend server port |
| `MONGO_URI` | `mongodb://localhost:27017/containersDB` | Local MongoDB |
| `DOCKER_SOCKET` | `//./pipe/docker_engine` (Win) | Docker socket path |
| `JWT_SECRET` | Any secure string | JWT signing key |
| `CORS_ORIGIN` | `http://localhost:3000` | Frontend URL |

---

**Happy Local Testing! 🚀**

Need help? Check the troubleshooting section or ask for assistance!


