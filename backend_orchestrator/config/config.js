import dotenv from "dotenv";

dotenv.config();

const config = {
  // Server configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // HTTPS configuration
  https: {
    enabled: process.env.HTTPS_ENABLED === 'true',
    port: process.env.HTTPS_PORT || 5443,
    certPath: process.env.SSL_CERT_PATH || '/etc/ssl/certs/server.crt',
    keyPath: process.env.SSL_KEY_PATH || '/etc/ssl/private/server.key',
    caPath: process.env.SSL_CA_PATH || '/etc/ssl/certs/ca.crt',
    passphrase: process.env.SSL_PASSPHRASE || null
  },
  
  // Database configuration
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/containersDB',
  
  // CORS configuration
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Docker configuration
  dockerSocket: process.env.DOCKER_SOCKET || (process.platform === 'win32' ? '\\\\.\\pipe\\docker_engine' : '/var/run/docker.sock'),
  
  // Security configuration
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  
  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100, // requests per window
  
  // Container sync interval (in milliseconds)
  syncInterval: parseInt(process.env.SYNC_INTERVAL) || 30000, // 30 seconds
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // WebSocket configuration
  wsHeartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL) || 30000, // 30 seconds
  wsMaxReconnectAttempts: parseInt(process.env.WS_MAX_RECONNECT_ATTEMPTS) || 5
};

// Validate required configuration
const requiredConfig = ['mongoUri'];
for (const key of requiredConfig) {
  if (!config[key]) {
    throw new Error(`Missing required configuration: ${key}`);
  }
}

export default config; 