# RBAC & JWT Testing Guide

## 🎯 Purpose
This guide helps you test Role-Based Access Control (RBAC) and JWT authentication in the Docker Orchestrator API.

---

## 📦 **Import the Collection**

1. Open Postman
2. Click **Import**
3. Select `RBAC_JWT_Testing.postman_collection.json`
4. Done! ✅

---

## 🔐 **Role Permissions Matrix**

| Feature | Admin | Operator | Viewer |
|---------|-------|----------|--------|
| **View Containers** | ✅ | ✅ | ✅ |
| **View Container Logs** | ✅ | ✅ | ✅ |
| **View Container Stats** | ✅ | ✅ | ✅ |
| **View Images** | ✅ | ✅ | ✅ |
| **Start/Stop Containers** | ✅ | ✅ | ❌ |
| **Delete Containers** | ✅ | ✅ | ❌ |
| **Create Containers** | ✅ | ✅ | ❌ |
| **Execute Commands** | ✅ | ✅ | ❌ |
| **Build Images** | ✅ | ✅ | ❌ |
| **View All Users** | ✅ | ❌ | ❌ |
| **Create Users** | ✅ | ❌ | ❌ |
| **Update Users** | ✅ | ❌ | ❌ |
| **Delete Users** | ✅ | ❌ | ❌ |
| **Sync Containers** | ✅ | ❌ | ❌ |

---

## 🚀 **Step-by-Step Testing Guide**

### **Step 1: Setup Test Users**

Run these in order (one-time setup):

1. **Create Admin User**
   - Request: `1. Setup - Create Test Users` → `Create Admin User`
   - Creates: `admin@test.com` / `admin123`
   - **Important**: Manually update role to "admin" in MongoDB

2. **Create Operator User**
   - Request: `1. Setup - Create Test Users` → `Create Operator User`
   - Creates: `operator@test.com` / `operator123`
   - **Important**: Manually update role to "operator" in MongoDB

3. **Create Viewer User**
   - Request: `1. Setup - Create Test Users` → `Create Viewer User`
   - Creates: `viewer@test.com` / `viewer123`
   - Role: `viewer` (default)

#### **Update Roles in MongoDB**

```bash
# Connect to MongoDB
mongosh containersDB

# Update admin role
db.users.updateOne(
  { email: "admin@test.com" },
  { $set: { role: "admin" } }
)

# Update operator role
db.users.updateOne(
  { email: "operator@test.com" },
  { $set: { role: "operator" } }
)
```

---

### **Step 2: JWT Authentication Tests**

Test JWT token functionality:

#### **✅ Valid Login Tests**
1. **Login as Admin** - Should return token with admin role
2. **Login as Operator** - Should return token with operator role
3. **Login as Viewer** - Should return token with viewer role

All tokens are automatically saved to variables:
- `{{admin_token}}`
- `{{operator_token}}`
- `{{viewer_token}}`

#### **❌ Invalid JWT Tests**
4. **Login with Invalid Credentials** - Should return 401
5. **Access with No Token** - Should return 401/403
6. **Access with Invalid Token** - Should return 401/403

---

### **Step 3: Admin Role Tests**

All should **succeed** (✅):

1. ✅ Get All Containers
2. ✅ Start Container
3. ✅ Get All Users
4. ✅ Add New User
5. ✅ Sync Containers

**Expected Results:**
- All requests return `200` or `201`
- Admin has full access to everything

---

### **Step 4: Operator Role Tests**

#### **✅ Should Succeed:**
1. ✅ Get All Containers
2. ✅ Start Container
3. ✅ Stop Container

#### **❌ Should Fail (403 Forbidden):**
4. ❌ Get All Users
5. ❌ Add User
6. ❌ Sync Containers

**Expected Results:**
- Container operations: `200` (success)
- User management operations: `403` (forbidden)
- Sync operations: `403` (forbidden)

---

### **Step 5: Viewer Role Tests**

#### **✅ Should Succeed (Read-Only):**
1. ✅ Get All Containers
2. ✅ Get Container Logs

#### **❌ Should Fail (403 Forbidden):**
3. ❌ Start Container
4. ❌ Stop Container
5. ❌ Delete Container
6. ❌ Get All Users

**Expected Results:**
- Read operations: `200` (success)
- All write operations: `403` (forbidden)
- User management: `403` (forbidden)

---

## 🧪 **Automated Test Execution**

### **Run All Tests**

In Postman:
1. Click on collection name
2. Click **Run** button
3. Select all folders
4. Click **Run RBAC & JWT Testing**

### **Expected Test Results**

```
✅ Total Tests: 30+
✅ Passing Tests: 30+
❌ Failing Tests: 0

Test Breakdown:
- JWT Auth Tests: 6 tests
- Admin Tests: 5 tests (all pass)
- Operator Tests: 6 tests (3 pass, 3 fail as expected)
- Viewer Tests: 6 tests (2 pass, 4 fail as expected)
```

---

## 📊 **Test Scripts Included**

Each request has automated test scripts:

### **Success Tests (✅)**
```javascript
pm.test('✅ Admin can view containers', function () {
    pm.response.to.have.status(200);
});
```

### **Failure Tests (❌)**
```javascript
pm.test('❌ Viewer CANNOT start containers', function () {
    pm.response.to.have.status(403);
});

pm.test('Forbidden error returned', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.error.message).to.include('Forbidden');
});
```

---

## 🛡️ **Security Scenarios Tested**

### **1. Authentication**
- ✅ Valid credentials login
- ❌ Invalid credentials rejected
- ❌ No token access denied
- ❌ Invalid token rejected
- ✅ Token properly stored and reused

### **2. Authorization (RBAC)**
- ✅ Admin full access
- ✅ Operator container management
- ❌ Operator cannot manage users
- ✅ Viewer read-only access
- ❌ Viewer cannot modify anything

### **3. JWT Token Management**
- ✅ Token generated on login
- ✅ Token includes user role
- ✅ Token validated on each request
- ✅ Separate tokens for different users

---

## 🔍 **Troubleshooting**

### **Issue: 403 Forbidden on Admin User**

**Cause**: Role not updated to "admin" in MongoDB

**Fix**:
```bash
mongosh containersDB
db.users.updateOne(
  { email: "admin@test.com" },
  { $set: { role: "admin" } }
)
```

---

### **Issue: "No token provided"**

**Cause**: Forgot to login first

**Fix**: Run the Login request for the respective role first

---

### **Issue: "Invalid token"**

**Cause**: Token expired or corrupted

**Fix**: Login again to get a fresh token

---

### **Issue: Tests show unexpected passes/failures**

**Cause**: Backend RBAC not properly implemented

**Fix**: Check middleware in `backend_orchestrator/middleware/auth.js`

---

## 📝 **Manual Testing Checklist**

### **Setup**
- [ ] Backend server running
- [ ] MongoDB running
- [ ] 3 test users created (admin, operator, viewer)
- [ ] Roles updated in MongoDB
- [ ] Postman collection imported

### **JWT Tests**
- [ ] Admin login successful (token saved)
- [ ] Operator login successful (token saved)
- [ ] Viewer login successful (token saved)
- [ ] Invalid credentials rejected
- [ ] No token access denied
- [ ] Invalid token rejected

### **Admin Tests**
- [ ] Can view containers
- [ ] Can start/stop containers
- [ ] Can view users
- [ ] Can create users
- [ ] Can sync containers

### **Operator Tests**
- [ ] Can view containers
- [ ] Can start/stop containers
- [ ] Cannot view users (403)
- [ ] Cannot create users (403)
- [ ] Cannot sync containers (403)

### **Viewer Tests**
- [ ] Can view containers
- [ ] Can view logs
- [ ] Cannot start containers (403)
- [ ] Cannot stop containers (403)
- [ ] Cannot delete containers (403)
- [ ] Cannot view users (403)

---

## 🎓 **Understanding JWT Tokens**

### **Token Structure**

JWT tokens have 3 parts: `header.payload.signature`

Example decoded token payload:
```json
{
  "id": "user_id_here",
  "email": "admin@test.com",
  "role": "admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### **Token Verification**

Tokens are verified on each request:
1. Extract token from `Authorization: Bearer <token>` header
2. Verify signature using `JWT_SECRET`
3. Check expiration time
4. Extract user info (id, role)
5. Check if user role has permission

---

## 🔐 **RBAC Implementation Details**

### **How Authorization Works**

1. **Middleware Chain**:
   ```
   Request → authenticateJWT → authorizeRoles → Controller
   ```

2. **Authentication (JWT)**:
   - Verifies token is valid
   - Extracts user info
   - Attaches user to `req.user`

3. **Authorization (RBAC)**:
   - Checks if `req.user.role` is in allowed roles
   - Returns 403 if not authorized
   - Continues if authorized

### **Example Route Protection**

```javascript
// All roles can access
router.get('/containers', 
  authenticateJWT, 
  authorizeRoles('admin', 'operator', 'viewer'), 
  getContainers
);

// Only admin and operator
router.post('/containers/:id/start', 
  authenticateJWT, 
  authorizeRoles('admin', 'operator'), 
  startContainer
);

// Only admin
router.get('/users', 
  authenticateJWT, 
  authorizeRoles('admin'), 
  getUsers
);
```

---

## 📈 **Advanced Testing**

### **Test Token Expiration**

1. Login and save token
2. Change `JWT_EXPIRES_IN` in `.env` to `5s`
3. Restart server
4. Login again
5. Wait 6 seconds
6. Try to access endpoint
7. Should return 401 (token expired)

### **Test Role Changes**

1. Login as viewer
2. In MongoDB, update role to admin
3. Try admin endpoint with old token
4. Should still be viewer (role in token)
5. Login again
6. New token should have admin role

---

## ✅ **Success Criteria**

Your RBAC and JWT are working correctly if:

- ✅ All 3 roles can login
- ✅ Admin can access everything
- ✅ Operator can manage containers but not users
- ✅ Viewer can only read data
- ✅ Invalid credentials are rejected
- ✅ No token access is denied
- ✅ Invalid tokens are rejected
- ✅ 403 errors on unauthorized actions

---

**Happy Testing! 🚀**

For issues or questions, check the troubleshooting section above.


