// API Configuration
// Default to same-origin so Kubernetes frontend Nginx proxies /api to backend
// Optionally override via REACT_APP_API_URL when needed (e.g., local dev)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  ADD_USER: `${API_BASE_URL}/api/auth/add-user`,
  GET_USERS: `${API_BASE_URL}/api/auth/users`,
  UPDATE_USER: (userId) => `${API_BASE_URL}/api/auth/users/${userId}`,
  DELETE_USER: (userId) => `${API_BASE_URL}/api/auth/users/${userId}`,
  
  // Container endpoints
  CONTAINERS: `${API_BASE_URL}/api/containers`,
  CONTAINER_LOGS: (id) => `${API_BASE_URL}/api/containers/${id}/logs`,
  CONTAINER_STATS: (id) => `${API_BASE_URL}/api/containers/${id}/stats`,
  CONTAINER_START: (id) => `${API_BASE_URL}/api/containers/${id}/start`,
  CONTAINER_STOP: (id) => `${API_BASE_URL}/api/containers/${id}/stop`,
  CONTAINER_DELETE: (id) => `${API_BASE_URL}/api/containers/${id}`,
  CONTAINER_CREATE: `${API_BASE_URL}/api/containers/create`,
  CONTAINER_BUILD_AND_CREATE: `${API_BASE_URL}/api/containers/build-and-create`,
  
  // Image endpoints
  IMAGES: `${API_BASE_URL}/api/containers/images`,
  
  // WebSocket
  WEBSOCKET_URL: process.env.REACT_APP_WS_URL || window.location.origin.replace('http', 'ws'),
};

export default API_ENDPOINTS; 