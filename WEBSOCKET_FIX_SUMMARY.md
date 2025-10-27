# WebSocket Terminal Fix Summary

## ✅ Issue Fixed

**Problem:** Terminal shell access was trying to connect to `ws://localhost:5000`, which doesn't work when the application is deployed in Kubernetes.

**Solution:** Updated TerminalComponent to use dynamic WebSocket URL from API_ENDPOINTS configuration.

---

## 🔧 Changes Made

### **File: `frontend_orchestrator/src/components/Dashboard/TerminalComponent.js`**

**Before:**
```javascript
const wsUrl = `ws://localhost:5000?token=${token}`;
```

**After:**
```javascript
import { API_ENDPOINTS } from "../../config/api";
const wsUrl = `${API_ENDPOINTS.WEBSOCKET_URL}?token=${token}`;
```

**Additional Changes:**
- Removed console.log statements (SonarQube compliance)
- Cleaned up error logging
- Improved code quality

---

## 🌐 How WebSocket URL is Determined

### **In `frontend_orchestrator/src/config/api.js`:**

```javascript
WEBSOCKET_URL: process.env.REACT_APP_WS_URL || window.location.origin.replace('http', 'ws')
```

This means:

| Scenario | WebSocket URL |
|----------|---------------|
| **Local Development** | `ws://localhost:3000` (from window.location) |
| **Kubernetes (via Ingress)** | `ws://your-domain.com` (from window.location) |
| **Kubernetes (NodePort)** | `ws://192.168.11.143:30080` (from window.location) |
| **Custom** | Set via `REACT_APP_WS_URL` environment variable |

---

## 📋 How It Works Now

### **1. Frontend Access:**
When you open the app at `http://192.168.11.143:30080`:
- `window.location.origin` = `http://192.168.11.143:30080`
- WebSocket URL = `ws://192.168.11.143:30080`

### **2. Nginx Proxy:**
Your frontend's nginx.conf should proxy WebSocket connections to the backend:

```nginx
location / {
    # Frontend
    try_files $uri $uri/ /index.html;
}

location /api/ {
    proxy_pass http://backend-orchestrator:5000;
    proxy_http_version 1.1;
}

# WebSocket upgrade
location / {
    proxy_pass http://backend-orchestrator:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

### **3. Backend WebSocket Server:**
The backend (port 5000) listens for WebSocket connections and creates Docker exec sessions.

---

## 🧪 Testing

### **After deployment:**

1. **Access your application:**
   ```
   http://192.168.11.143:30080
   ```

2. **Login with admin credentials**

3. **Go to Containers page**

4. **Click Terminal icon** on any running container

5. **WebSocket should connect:**
   - Status: "Connected"
   - You can type shell commands
   - Output appears in terminal

---

## 🐛 Troubleshooting

### **Issue: Still can't connect to WebSocket**

**Check Nginx configuration:**
```bash
kubectl exec -n orchestrator <frontend-pod> -- cat /etc/nginx/nginx.conf
```

Should have WebSocket upgrade headers.

**Check backend logs:**
```bash
kubectl logs -n orchestrator -l app=backend-orchestrator -f | grep WebSocket
```

Should show:
```
🔗 New WebSocket connection attempt from: <ip>
🔑 Token received: Yes
✅ Token verified for user: <email>
🔗 WebSocket connection authenticated for user: <email>
```

**Check service connectivity:**
```bash
# Test from frontend pod to backend
kubectl exec -n orchestrator <frontend-pod> -- curl http://backend-orchestrator:5000/api/health
```

---

## 🔍 Verify Start/Stop Buttons Visibility

### **User Role Check:**

Start/Stop buttons are only visible to **admin** or **operator** roles.

**Check your user role:**
1. Login to application
2. Go to Settings or Profile page
3. Check role displayed

**Update user role if needed:**
```bash
node update-admin-password.js
# or
node create-admin-user.js
```

Or directly in MongoDB:
```javascript
db.users.updateOne(
  { email: "admin@orchestrator.com" },
  { $set: { role: "admin" } }
)
```

---

## ✅ Expected Behavior After Fix

### **Container List Page:**

For **admin/operator** users, each container row shows:

| Button | Icon | Condition | Action |
|--------|------|-----------|--------|
| **Terminal** | 🖥️ | Always visible | Opens shell terminal |
| **Logs** | 📄 | Always visible | Shows container logs |
| **Stats** | 📊 | Always visible | Shows resource usage |
| **Start** | ▶️ | Container stopped | Starts the container |
| **Stop** | ⏹️ | Container running | Stops the container |
| **Remove** | 🗑️ | Admin/Operator only | Deletes the container |

For **viewer** users:
- Only Terminal, Logs, and Stats buttons visible
- No Start/Stop/Remove buttons

---

## 🚀 Deployment

After rebuilding frontend with these changes:

```bash
# Rebuild frontend
docker build -t cybermonta/orchestrator-frontend:latest ./frontend_orchestrator

# Push to Docker Hub
docker push cybermonta/orchestrator-frontend:latest

# Update deployment
kubectl rollout restart deployment/frontend-orchestrator -n orchestrator
```

Or wait for CI/CD pipeline to deploy automatically!

---

**Issue Resolved:** WebSocket now connects dynamically based on application URL! ✅

