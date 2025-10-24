# Axios Testing Guide - Docker Orchestrator API

## 🎯 Overview

This guide shows you how to test your API using **axios** in Node.js scripts, which is useful for:
- Automated testing
- CI/CD integration
- Quick API validation
- Load testing
- Script-based workflows

---

## 📦 **Test Scripts Created**

### **1. `test-axios-api.js`** - Basic API Testing
Tests core API functionality with axios

### **2. `test-rbac-axios.js`** - RBAC & JWT Testing  
Comprehensive role-based access control tests

---

## 🚀 **Quick Start**

### **Step 1: Install Dependencies**

If axios isn't installed globally, install it in your project:

```bash
cd C:\Users\Mega-PC\Desktop\Orchestrator
npm install axios
```

### **Step 2: Ensure Backend is Running**

```bash
cd backend_orchestrator
npm run dev
```

Verify it's running at `http://localhost:5000`

### **Step 3: Run Tests**

```bash
# Basic API tests
node test-axios-api.js

# RBAC & JWT tests
node test-rbac-axios.js
```

---

## 📋 **Test Scripts Breakdown**

### **test-axios-api.js**

Tests basic API functionality:
1. ✅ Login with valid credentials
2. ❌ Login with invalid credentials (should fail)
3. ❌ Access without token (should fail)
4. ✅ Get all containers
5. ✅ Get container stats
6. ✅ Get container logs
7. ✅ Start container
8. ✅ Get all Docker images
9. ✅ Get all users (admin only)
10. ✅ Sync containers (admin only)

**Output Example:**
```
🧪 Docker Orchestrator API Testing with Axios
===============================================================
ℹ️  Test 1: Login with valid credentials
✅ Login successful! Role: admin
ℹ️  Token: eyJhbGciOiJIUzI1NiIs...

ℹ️  Test 4: Get all containers
✅ Retrieved 5 containers
   Containers: nginx-web, redis-cache, postgres-db

📊 Test Summary
===============================================================
✅ Passed: 10
❌ Failed: 0
```

---

### **test-rbac-axios.js**

Comprehensive RBAC testing for all three roles:

**Admin Tests (8 tests):**
- View containers, logs, stats, images ✅
- Start/stop containers ✅
- View users ✅
- Sync containers ✅

**Operator Tests (7 tests):**
- View containers, logs ✅
- Start/stop containers ✅
- View users ❌ (should be denied)
- Add users ❌ (should be denied)
- Sync containers ❌ (should be denied)

**Viewer Tests (9 tests):**
- View containers, logs, stats, images ✅
- Start/stop/delete containers ❌ (should be denied)
- View users ❌ (should be denied)
- Sync containers ❌ (should be denied)

**Output Example:**
```
🧪 RBAC & JWT Testing Suite - Docker Orchestrator API
======================================================================
🔐 Logging in as ADMIN...
✅ ADMIN logged in successfully

👑 ADMIN ROLE TESTS (Should have FULL access)
======================================================================
  ✅ View all containers
     Expected: PASS | Actual: ALLOWED
  ✅ View all users
     Expected: PASS | Actual: ALLOWED
  ✅ Sync containers to DB
     Expected: PASS | Actual: ALLOWED

🔧 OPERATOR ROLE TESTS (Container management only)
======================================================================
  ✅ View all containers
     Expected: PASS | Actual: ALLOWED
  ✅ Start container
     Expected: PASS | Actual: ALLOWED
  ✅ View all users (SHOULD BE DENIED)
     Expected: DENIED | Actual: DENIED (403)

👀 VIEWER ROLE TESTS (Read-only access)
======================================================================
  ✅ View all containers
     Expected: PASS | Actual: ALLOWED
  ✅ Start container (SHOULD BE DENIED)
     Expected: DENIED | Actual: DENIED (403)
  ✅ View all users (SHOULD BE DENIED)
     Expected: DENIED | Actual: DENIED (403)

📊 TEST SUMMARY
======================================================================
Total Tests: 24
Passed: 24
Failed: 0
Success Rate: 100.0%
🎉 All RBAC tests passed! Your authorization is working correctly.
```

---

## 🛠️ **Custom Axios Testing**

### **Basic Template**

```javascript
import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
let token = '';

// 1. Login
async function login() {
  const response = await axios.post(`${BASE_URL}/api/auth/login`, {
    email: 'admin@test.com',
    password: 'admin123'
  });
  token = response.data.token;
  console.log('Logged in! Token:', token.substring(0, 20) + '...');
}

// 2. Make authenticated request
async function getContainers() {
  const response = await axios.get(`${BASE_URL}/api/containers`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Containers:', response.data.containers);
}

// Run tests
async function main() {
  await login();
  await getContainers();
}

main();
```

---

## 🧪 **Testing Specific Scenarios**

### **Test 1: JWT Token Validation**

```javascript
import axios from 'axios';

// Test with valid token
async function testValidToken() {
  const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
    email: 'admin@test.com',
    password: 'admin123'
  });
  
  const token = loginRes.data.token;
  
  const containersRes = await axios.get('http://localhost:5000/api/containers', {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  console.log('✅ Valid token works:', containersRes.status === 200);
}

// Test with invalid token
async function testInvalidToken() {
  try {
    await axios.get('http://localhost:5000/api/containers', {
      headers: { Authorization: 'Bearer invalid.token.here' }
    });
    console.log('❌ Invalid token should have been rejected!');
  } catch (error) {
    console.log('✅ Invalid token rejected:', error.response?.status === 401 || error.response?.status === 403);
  }
}

// Test with no token
async function testNoToken() {
  try {
    await axios.get('http://localhost:5000/api/containers');
    console.log('❌ No token should have been rejected!');
  } catch (error) {
    console.log('✅ No token rejected:', error.response?.status === 401 || error.response?.status === 403);
  }
}

testValidToken();
testInvalidToken();
testNoToken();
```

---

### **Test 2: Role-Based Access**

```javascript
import axios from 'axios';

async function testRoleAccess(email, password, expectedRole) {
  // Login
  const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
    email,
    password
  });
  
  const token = loginRes.data.token;
  const actualRole = loginRes.data.user.role;
  
  console.log(`\nTesting ${expectedRole} role:`);
  console.log(`  Actual role: ${actualRole}`);
  
  // Test user management endpoint (admin only)
  try {
    await axios.get('http://localhost:5000/api/auth/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`  ✅ Can access user management (admin)`);
  } catch (error) {
    console.log(`  ❌ Cannot access user management (${error.response?.status})`);
  }
  
  // Test container start (admin/operator only)
  try {
    await axios.post('http://localhost:5000/api/containers/test-id/start', null, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`  ✅ Can start containers (admin/operator)`);
  } catch (error) {
    console.log(`  ❌ Cannot start containers (${error.response?.status})`);
  }
}

// Test all roles
testRoleAccess('admin@test.com', 'admin123', 'admin');
testRoleAccess('operator@test.com', 'operator123', 'operator');
testRoleAccess('viewer@test.com', 'viewer123', 'viewer');
```

---

### **Test 3: Container Operations**

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

async function testContainerOperations() {
  // Login
  const loginRes = await api.post('/api/auth/login', {
    email: 'admin@test.com',
    password: 'admin123'
  });
  
  const token = loginRes.data.token;
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  
  // Get containers
  const containersRes = await api.get('/api/containers');
  console.log(`✅ Found ${containersRes.data.count} containers`);
  
  // Get images
  const imagesRes = await api.get('/api/containers/images');
  console.log(`✅ Found ${imagesRes.data.count} images`);
  
  // Create container
  const createRes = await api.post('/api/containers/create', {
    imageName: 'nginx:alpine',
    containerName: 'test-nginx-axios',
    ports: [{ host: '8082', container: '80' }]
  });
  console.log(`✅ Container created:`, createRes.data.container.name);
  
  // Get container stats
  const statsRes = await api.get(`/api/containers/${createRes.data.container.id}/stats`);
  console.log(`✅ Stats - CPU: ${statsRes.data.stats.cpuUsage}%`);
}

testContainerOperations();
```

---

## 🔧 **Axios Configuration Options**

### **Create Axios Instance**

```javascript
const api = axios.create({
  baseURL: 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to all requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token'); // or your token storage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      console.log('❌ Unauthorized - please login');
    } else if (error.response?.status === 403) {
      console.log('❌ Forbidden - insufficient permissions');
    }
    return Promise.reject(error);
  }
);
```

---

## 🧪 **Unit Testing with Jest**

### **Install Jest**

```bash
npm install --save-dev jest @types/jest axios-mock-adapter
```

### **Example Test File**

```javascript
// __tests__/api.test.js
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

const mock = new MockAdapter(axios);
const BASE_URL = 'http://localhost:5000';

describe('Docker Orchestrator API', () => {
  afterEach(() => {
    mock.reset();
  });

  test('Login with valid credentials', async () => {
    mock.onPost(`${BASE_URL}/api/auth/login`).reply(200, {
      token: 'fake-jwt-token',
      user: { email: 'admin@test.com', role: 'admin' }
    });

    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });

    expect(response.status).toBe(200);
    expect(response.data.token).toBeDefined();
    expect(response.data.user.role).toBe('admin');
  });

  test('Get containers requires authentication', async () => {
    mock.onGet(`${BASE_URL}/api/containers`).reply(401, {
      error: { message: 'No token provided' }
    });

    try {
      await axios.get(`${BASE_URL}/api/containers`);
    } catch (error) {
      expect(error.response.status).toBe(401);
    }
  });

  test('Admin can access user management', async () => {
    mock.onGet(`${BASE_URL}/api/auth/users`).reply(200, {
      users: [],
      count: 0
    });

    const response = await axios.get(`${BASE_URL}/api/auth/users`, {
      headers: { Authorization: 'Bearer admin-token' }
    });

    expect(response.status).toBe(200);
  });
});
```

Run tests:
```bash
npm test
```

---

## 📊 **Load Testing with Axios**

### **Simple Load Test**

```javascript
import axios from 'axios';

async function loadTest() {
  // Login once
  const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
    email: 'admin@test.com',
    password: 'admin123'
  });
  const token = loginRes.data.token;
  
  // Make 100 concurrent requests
  const requests = [];
  for (let i = 0; i < 100; i++) {
    requests.push(
      axios.get('http://localhost:5000/api/containers', {
        headers: { Authorization: `Bearer ${token}` }
      })
    );
  }
  
  const start = Date.now();
  const results = await Promise.allSettled(requests);
  const duration = Date.now() - start;
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  console.log(`\n📊 Load Test Results:`);
  console.log(`   Total Requests: 100`);
  console.log(`   Successful: ${successful}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Duration: ${duration}ms`);
  console.log(`   Avg: ${(duration/100).toFixed(2)}ms per request\n`);
}

loadTest();
```

---

## 🔍 **Common Axios Patterns**

### **1. GET Request**

```javascript
const response = await axios.get('http://localhost:5000/api/containers', {
  headers: { Authorization: `Bearer ${token}` }
});
console.log(response.data);
```

### **2. POST Request**

```javascript
const response = await axios.post('http://localhost:5000/api/containers/create', {
  imageName: 'nginx:alpine',
  containerName: 'my-nginx'
}, {
  headers: { Authorization: `Bearer ${token}` }
});
console.log(response.data);
```

### **3. PUT Request**

```javascript
const response = await axios.put('http://localhost:5000/api/auth/users/123', {
  role: 'admin'
}, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### **4. DELETE Request**

```javascript
const response = await axios.delete('http://localhost:5000/api/containers/abc123', {
  headers: { Authorization: `Bearer ${token}` }
});
```

### **5. Error Handling**

```javascript
try {
  const response = await axios.get('http://localhost:5000/api/containers', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('✅ Success:', response.data);
} catch (error) {
  if (error.response) {
    // Server responded with error
    console.log('❌ Error:', error.response.status);
    console.log('   Message:', error.response.data);
  } else if (error.request) {
    // No response received
    console.log('❌ No response from server');
  } else {
    // Request setup error
    console.log('❌ Request error:', error.message);
  }
}
```

---

## 🎯 **Integration with CI/CD**

### **GitHub Actions Example**

```yaml
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: npm install
      
      - name: Start MongoDB
        run: |
          docker run -d -p 27017:27017 mongo:latest
      
      - name: Start Backend
        run: |
          cd backend_orchestrator
          npm install
          npm start &
          sleep 10
      
      - name: Run Axios Tests
        run: |
          node test-axios-api.js
          node test-rbac-axios.js
```

---

## 📈 **Advanced Testing Patterns**

### **Retry Logic**

```javascript
async function retryRequest(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// Usage
const result = await retryRequest(() => 
  axios.get('http://localhost:5000/api/containers', {
    headers: { Authorization: `Bearer ${token}` }
  })
);
```

### **Parallel Requests**

```javascript
const [containers, images, users] = await Promise.all([
  axios.get(`${BASE_URL}/api/containers`, { headers: { Authorization: `Bearer ${token}` } }),
  axios.get(`${BASE_URL}/api/containers/images`, { headers: { Authorization: `Bearer ${token}` } }),
  axios.get(`${BASE_URL}/api/auth/users`, { headers: { Authorization: `Bearer ${token}` } })
]);

console.log('Containers:', containers.data.count);
console.log('Images:', images.data.count);
console.log('Users:', users.data.count);
```

### **Request Timeout**

```javascript
const response = await axios.get('http://localhost:5000/api/containers', {
  timeout: 5000, // 5 seconds
  headers: { Authorization: `Bearer ${token}` }
});
```

---

## 🛡️ **Security Testing with Axios**

### **Test SQL Injection Protection**

```javascript
// Try SQL injection in container ID
try {
  await axios.get(`http://localhost:5000/api/containers/' OR '1'='1/logs`, {
    headers: { Authorization: `Bearer ${token}` }
  });
} catch (error) {
  console.log('✅ SQL injection prevented:', error.response?.status === 400);
}
```

### **Test XSS Protection**

```javascript
// Try XSS in user creation
try {
  await axios.post('http://localhost:5000/api/auth/add-user', {
    email: '<script>alert("xss")</script>@test.com',
    password: 'password123',
    role: 'viewer'
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
} catch (error) {
  console.log('✅ XSS prevented or sanitized');
}
```

---

## ✅ **Checklist for Axios Testing**

- [ ] Axios installed (`npm install axios`)
- [ ] Backend server running
- [ ] MongoDB running
- [ ] Test users created
- [ ] Test scripts executable
- [ ] Basic API test passes
- [ ] RBAC test passes
- [ ] All expected denials work (403 errors)
- [ ] Token expiration handled
- [ ] Error handling tested

---

## 🎓 **Axios vs Postman**

| Feature | Axios | Postman |
|---------|-------|---------|
| **Quick Manual Testing** | ❌ | ✅ |
| **Automated Testing** | ✅ | ✅ |
| **CI/CD Integration** | ✅ | ⚠️ (via Newman) |
| **Scripting** | ✅ | ⚠️ (Limited) |
| **Visual Interface** | ❌ | ✅ |
| **Version Control** | ✅ | ⚠️ |
| **Load Testing** | ✅ | ⚠️ |
| **Programmatic Control** | ✅ | ❌ |

**Best Practice**: Use **Postman** for manual testing and exploration, **Axios** for automated tests and CI/CD.

---

**Happy Testing with Axios! 🚀**


