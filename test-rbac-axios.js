// RBAC Testing Script with Axios
// Tests all three roles: Admin, Operator, Viewer
// Run with: node test-rbac-axios.js

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

// Test users
const testUsers = {
  admin: { email: 'admin@test.com', password: 'admin123', token: '' },
  operator: { email: 'operator@test.com', password: 'operator123', token: '' },
  viewer: { email: 'viewer@test.com', password: 'viewer123', token: '' }
};

// Helper functions
const makeRequest = async (method, endpoint, data, token) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    };
    if (data) config.data = data;
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      status: error.response?.status,
      error: error.response?.data?.error?.message || error.message 
    };
  }
};

// Login helper
async function login(role) {
  const user = testUsers[role];
  console.log(`\n${colors.blue}🔐 Logging in as ${role.toUpperCase()}...${colors.reset}`);
  
  const result = await makeRequest('POST', '/api/auth/login', {
    email: user.email,
    password: user.password
  });
  
  if (result.success) {
    user.token = result.data.token;
    console.log(`${colors.green}✅ ${role.toUpperCase()} logged in successfully${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.red}❌ ${role.toUpperCase()} login failed: ${result.error}${colors.reset}`);
    return false;
  }
}

// Test function with expected result
async function testEndpoint(role, method, endpoint, shouldSucceed, description, data = null) {
  const token = testUsers[role].token;
  const result = await makeRequest(method, endpoint, data, token);
  
  const success = shouldSucceed ? result.success : (result.status === 403);
  const icon = success ? '✅' : '❌';
  const color = success ? colors.green : colors.red;
  const expected = shouldSucceed ? 'PASS' : 'DENIED';
  const actual = result.success ? 'ALLOWED' : `DENIED (${result.status})`;
  
  console.log(`  ${color}${icon} ${description}${colors.reset}`);
  console.log(`     Expected: ${expected} | Actual: ${actual}`);
  
  return success;
}

// Main test suite
async function runRBACTests() {
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.magenta}🧪 RBAC & JWT Testing Suite - Docker Orchestrator API${colors.reset}`);
  console.log('='.repeat(70));
  
  // Login all users
  await login('admin');
  await login('operator');
  await login('viewer');
  
  let totalTests = 0;
  let passedTests = 0;
  
  // Get a test container ID
  console.log(`\n${colors.blue}📦 Getting test container ID...${colors.reset}`);
  const containersResult = await makeRequest('GET', '/api/containers', null, testUsers.admin.token);
  const testContainerId = containersResult.data?.containers?.[0]?.containerId || 'test-container-id';
  console.log(`   Using container: ${testContainerId}`);
  
  // ==================== ADMIN TESTS ====================
  console.log(`\n${colors.magenta}${'='.repeat(70)}${colors.reset}`);
  console.log(`${colors.magenta}👑 ADMIN ROLE TESTS (Should have FULL access)${colors.reset}`);
  console.log(`${colors.magenta}${'='.repeat(70)}${colors.reset}`);
  
  const adminTests = [
    // Read operations
    ['GET', '/api/containers', true, 'View all containers'],
    ['GET', `/api/containers/${testContainerId}/logs`, true, 'View container logs'],
    ['GET', `/api/containers/${testContainerId}/stats`, true, 'View container stats'],
    ['GET', '/api/containers/images', true, 'View all images'],
    
    // Write operations
    ['POST', `/api/containers/${testContainerId}/start`, true, 'Start container'],
    ['POST', `/api/containers/${testContainerId}/stop`, true, 'Stop container'],
    
    // Admin operations
    ['GET', '/api/auth/users', true, 'View all users'],
    ['GET', '/api/containers/sync', true, 'Sync containers to DB']
  ];
  
  for (const [method, endpoint, shouldSucceed, description] of adminTests) {
    const result = await testEndpoint('admin', method, endpoint, shouldSucceed, description);
    totalTests++;
    if (result) passedTests++;
  }
  
  // ==================== OPERATOR TESTS ====================
  console.log(`\n${colors.magenta}${'='.repeat(70)}${colors.reset}`);
  console.log(`${colors.magenta}🔧 OPERATOR ROLE TESTS (Container management only)${colors.reset}`);
  console.log(`${colors.magenta}${'='.repeat(70)}${colors.reset}`);
  
  const operatorTests = [
    // Should succeed
    ['GET', '/api/containers', true, 'View all containers'],
    ['GET', `/api/containers/${testContainerId}/logs`, true, 'View container logs'],
    ['POST', `/api/containers/${testContainerId}/start`, true, 'Start container'],
    ['POST', `/api/containers/${testContainerId}/stop`, true, 'Stop container'],
    
    // Should fail (admin only)
    ['GET', '/api/auth/users', false, 'View all users (SHOULD BE DENIED)'],
    ['POST', '/api/auth/add-user', false, 'Add user (SHOULD BE DENIED)', { 
      email: 'test@test.com', 
      password: 'test123', 
      role: 'viewer' 
    }],
    ['GET', '/api/containers/sync', false, 'Sync containers (SHOULD BE DENIED)']
  ];
  
  for (const [method, endpoint, shouldSucceed, description, data] of operatorTests) {
    const result = await testEndpoint('operator', method, endpoint, shouldSucceed, description, data);
    totalTests++;
    if (result) passedTests++;
  }
  
  // ==================== VIEWER TESTS ====================
  console.log(`\n${colors.magenta}${'='.repeat(70)}${colors.reset}`);
  console.log(`${colors.magenta}👀 VIEWER ROLE TESTS (Read-only access)${colors.reset}`);
  console.log(`${colors.magenta}${'='.repeat(70)}${colors.reset}`);
  
  const viewerTests = [
    // Should succeed (read-only)
    ['GET', '/api/containers', true, 'View all containers'],
    ['GET', `/api/containers/${testContainerId}/logs`, true, 'View container logs'],
    ['GET', `/api/containers/${testContainerId}/stats`, true, 'View container stats'],
    ['GET', '/api/containers/images', true, 'View all images'],
    
    // Should fail (write operations)
    ['POST', `/api/containers/${testContainerId}/start`, false, 'Start container (SHOULD BE DENIED)'],
    ['POST', `/api/containers/${testContainerId}/stop`, false, 'Stop container (SHOULD BE DENIED)'],
    ['DELETE', `/api/containers/${testContainerId}`, false, 'Delete container (SHOULD BE DENIED)'],
    
    // Should fail (admin operations)
    ['GET', '/api/auth/users', false, 'View all users (SHOULD BE DENIED)'],
    ['GET', '/api/containers/sync', false, 'Sync containers (SHOULD BE DENIED)']
  ];
  
  for (const [method, endpoint, shouldSucceed, description, data] of viewerTests) {
    const result = await testEndpoint('viewer', method, endpoint, shouldSucceed, description, data);
    totalTests++;
    if (result) passedTests++;
  }
  
  // ==================== SUMMARY ====================
  console.log(`\n${'='.repeat(70)}`);
  console.log(`${colors.magenta}📊 TEST SUMMARY${colors.reset}`);
  console.log('='.repeat(70));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${totalTests - passedTests}${colors.reset}`);
  console.log(`Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
  console.log('='.repeat(70) + '\n');
  
  if (passedTests === totalTests) {
    console.log(`${colors.green}🎉 All RBAC tests passed! Your authorization is working correctly.${colors.reset}\n`);
  } else {
    console.log(`${colors.red}⚠️  Some tests failed. Check your RBAC implementation.${colors.reset}\n`);
  }
}

// Run tests
runRBACTests().catch(error => {
  console.error(`${colors.red}❌ Test execution failed: ${error.message}${colors.reset}`);
  process.exit(1);
});


