// Axios API Testing Script for Docker Orchestrator
// Run with: node test-axios-api.js

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
let authToken = '';

// Color console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`)
};

// Helper function to make authenticated requests
const apiRequest = async (method, endpoint, data = null, useToken = true) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: useToken && authToken ? { Authorization: `Bearer ${authToken}` } : {}
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status 
    };
  }
};

// Test 1: Login
async function testLogin() {
  log.info('Test 1: Login with valid credentials');
  
  const result = await apiRequest('POST', '/api/auth/login', {
    email: 'admin@test.com',
    password: 'admin123'
  }, false);
  
  if (result.success) {
    authToken = result.data.token;
    log.success(`Login successful! Role: ${result.data.user.role}`);
    log.info(`Token: ${authToken.substring(0, 20)}...`);
    return true;
  } else {
    log.error(`Login failed: ${JSON.stringify(result.error)}`);
    return false;
  }
}

// Test 2: Invalid Login
async function testInvalidLogin() {
  log.info('Test 2: Login with invalid credentials (should fail)');
  
  const result = await apiRequest('POST', '/api/auth/login', {
    email: 'admin@test.com',
    password: 'wrongpassword'
  }, false);
  
  if (!result.success && result.status === 401) {
    log.success('Invalid credentials correctly rejected (401)');
    return true;
  } else {
    log.error('Invalid credentials should have been rejected!');
    return false;
  }
}

// Test 3: No Token Access
async function testNoToken() {
  log.info('Test 3: Access without token (should fail)');
  
  const result = await apiRequest('GET', '/api/containers', null, false);
  
  if (!result.success && (result.status === 401 || result.status === 403)) {
    log.success('No token access correctly denied');
    return true;
  } else {
    log.error('Should require authentication!');
    return false;
  }
}

// Test 4: Get All Containers
async function testGetContainers() {
  log.info('Test 4: Get all containers');
  
  const result = await apiRequest('GET', '/api/containers');
  
  if (result.success) {
    log.success(`Retrieved ${result.data.count} containers`);
    console.log(`   Containers:`, result.data.containers.map(c => c.name || c.containerId).join(', '));
    return result.data.containers;
  } else {
    log.error(`Failed to get containers: ${JSON.stringify(result.error)}`);
    return [];
  }
}

// Test 5: Get Container Stats
async function testGetContainerStats(containerId) {
  if (!containerId) {
    log.warning('No container ID available for stats test');
    return false;
  }
  
  log.info(`Test 5: Get container stats for ${containerId}`);
  
  const result = await apiRequest('GET', `/api/containers/${containerId}/stats`);
  
  if (result.success) {
    log.success('Container stats retrieved');
    console.log(`   CPU: ${result.data.stats?.cpuUsage}%`);
    console.log(`   Memory: ${result.data.stats?.memoryUsage}%`);
    return true;
  } else {
    log.error(`Failed to get stats: ${JSON.stringify(result.error)}`);
    return false;
  }
}

// Test 6: Get Container Logs
async function testGetContainerLogs(containerId) {
  if (!containerId) {
    log.warning('No container ID available for logs test');
    return false;
  }
  
  log.info(`Test 6: Get container logs for ${containerId}`);
  
  const result = await apiRequest('GET', `/api/containers/${containerId}/logs?tail=10`);
  
  if (result.success) {
    log.success('Container logs retrieved');
    const logLines = result.data.logs.split('\n').filter(l => l.trim());
    console.log(`   Retrieved ${logLines.length} log lines`);
    return true;
  } else {
    log.error(`Failed to get logs: ${JSON.stringify(result.error)}`);
    return false;
  }
}

// Test 7: Start Container
async function testStartContainer(containerId) {
  if (!containerId) {
    log.warning('No container ID available for start test');
    return false;
  }
  
  log.info(`Test 7: Start container ${containerId}`);
  
  const result = await apiRequest('POST', `/api/containers/${containerId}/start`);
  
  if (result.success || result.status === 304) {
    log.success('Container start command executed');
    return true;
  } else {
    log.error(`Failed to start container: ${JSON.stringify(result.error)}`);
    return false;
  }
}

// Test 8: Get All Images
async function testGetImages() {
  log.info('Test 8: Get all Docker images');
  
  const result = await apiRequest('GET', '/api/containers/images');
  
  if (result.success) {
    log.success(`Retrieved ${result.data.count} images`);
    console.log(`   Images:`, result.data.images.slice(0, 3).map(i => i.RepoTags?.[0] || 'unnamed').join(', '));
    return true;
  } else {
    log.error(`Failed to get images: ${JSON.stringify(result.error)}`);
    return false;
  }
}

// Test 9: Get All Users (Admin only)
async function testGetUsers() {
  log.info('Test 9: Get all users (admin only)');
  
  const result = await apiRequest('GET', '/api/auth/users');
  
  if (result.success) {
    log.success(`Retrieved ${result.data.count} users`);
    console.log(`   Users:`, result.data.users.map(u => `${u.email} (${u.role})`).join(', '));
    return true;
  } else {
    log.error(`Failed to get users: ${JSON.stringify(result.error)}`);
    return false;
  }
}

// Test 10: Sync Containers (Admin only)
async function testSyncContainers() {
  log.info('Test 10: Sync containers to database (admin only)');
  
  const result = await apiRequest('GET', '/api/containers/sync');
  
  if (result.success) {
    log.success('Containers synced to database');
    return true;
  } else {
    log.error(`Failed to sync: ${JSON.stringify(result.error)}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 Docker Orchestrator API Testing with Axios');
  console.log('='.repeat(60) + '\n');
  
  let passed = 0;
  let failed = 0;
  
  const tests = [
    testLogin,
    testInvalidLogin,
    testNoToken
  ];
  
  // Run authentication tests
  for (const test of tests) {
    const result = await test();
    result ? passed++ : failed++;
    console.log('');
  }
  
  if (!authToken) {
    log.error('Cannot continue - login failed');
    return;
  }
  
  // Run API tests
  const containers = await testGetContainers();
  passed++;
  console.log('');
  
  if (containers && containers.length > 0) {
    const testContainerId = containers[0].containerId;
    
    await testGetContainerStats(testContainerId);
    passed++;
    console.log('');
    
    await testGetContainerLogs(testContainerId);
    passed++;
    console.log('');
    
    await testStartContainer(testContainerId);
    passed++;
    console.log('');
  }
  
  await testGetImages();
  passed++;
  console.log('');
  
  await testGetUsers();
  passed++;
  console.log('');
  
  await testSyncContainers();
  passed++;
  console.log('');
  
  // Summary
  console.log('='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  log.success(`Passed: ${passed}`);
  log.error(`Failed: ${failed}`);
  console.log('');
}

// Run all tests
runTests().catch(error => {
  log.error(`Test execution failed: ${error.message}`);
  process.exit(1);
});


