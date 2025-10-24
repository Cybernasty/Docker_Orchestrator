import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";
import { WebSocketServer } from "ws";
import { spawn } from "child_process";
import http from "http";
import https from "https";
import fs from "fs";
import containerRoutes from "./routes/containerRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { errorHandler } from "./utils/errors.js";
import config from "./config/config.js";
import { authenticateJWT } from "./middleware/auth.js";
import jwt from "jsonwebtoken";
import Docker from "dockerode";

// Initialize Docker connection with proper configuration
const dockerConfig = {};
if (config.dockerHost && config.dockerHost.startsWith('tcp://')) {
  // Use TCP connection (for remote Docker daemon)
  const url = new URL(config.dockerHost);
  dockerConfig.host = url.hostname;
  dockerConfig.port = url.port || 2375;
  console.log(`🔗 WebSocket using Docker TCP connection: ${config.dockerHost}`);
} else {
  // Use socket connection (for local Docker daemon)
  dockerConfig.socketPath = config.dockerSocket;
  console.log(`🔗 WebSocket using Docker socket: ${config.dockerSocket}`);
}
const docker = new Docker(dockerConfig);

const app = express();

// HTTPS configuration
let server;
if (config.https.enabled) {
  try {
    // Read SSL certificates
    const sslOptions = {
      cert: fs.readFileSync(config.https.certPath),
      key: fs.readFileSync(config.https.keyPath),
      ca: fs.readFileSync(config.https.caPath),
      passphrase: config.https.passphrase
    };
    
    server = https.createServer(sslOptions, app);
    console.log('🔒 HTTPS server configured with CA-signed certificates');
  } catch (error) {
    console.error('❌ Failed to load SSL certificates:', error.message);
    console.log('🔄 Falling back to HTTP server');
    server = http.createServer(app);
  }
} else {
  server = http.createServer(app);
}

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: {
    error: {
      name: 'RateLimitError',
      message: 'Too many requests, please try again later.',
      timestamp: new Date().toISOString()
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv
  });
});

// Auth routes (public)
app.use("/api/auth", authRoutes);

// Protect container routes
app.use("/api/containers", authenticateJWT, containerRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      name: 'NotFoundError',
      message: `Route ${req.originalUrl} not found`,
      timestamp: new Date().toISOString()
    }
  });
});

// WebSocket server setup
const wss = new WebSocketServer({ server });

// Add a simple test endpoint to verify WebSocket server is working
app.get('/ws-test', (req, res) => {
  res.json({ 
    message: 'WebSocket server is running',
    timestamp: new Date().toISOString(),
    clients: wss.clients.size
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// WebSocket connection handling
wss.on("connection", (ws, req) => {
  console.log("🔗 New WebSocket connection attempt from:", req.socket.remoteAddress);
  
  // Parse token from query string
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get("token");
  let user = null;
  
  console.log("🔑 Token received:", token ? "Yes" : "No");
  console.log("🌐 Full URL:", req.url);

  if (!token) {
    ws.send(JSON.stringify({ error: "Missing authentication token", timestamp: new Date().toISOString() }));
    ws.close();
    return;
  }

  try {
    user = jwt.verify(token, config.jwtSecret);
    console.log(`✅ Token verified for user: ${user.email}`);
  } catch (err) {
    console.log("❌ Token verification failed:", err.message);
    ws.send(JSON.stringify({ error: "Invalid or expired token", timestamp: new Date().toISOString() }));
    ws.close();
    return;
  }

  console.log(`🔗 WebSocket connection authenticated for user: ${user.email}`);

  let shell = null;
  let isAuthenticated = true;

  // Set up heartbeat to detect disconnected clients
  const heartbeat = () => {
    ws.isAlive = true;
  };
  
  ws.isAlive = true;
  ws.on('pong', heartbeat);

  ws.once("message", async (message) => {
    let containerId, containerName;
    try {
      const data = JSON.parse(message);
      ({ containerId, containerName } = data);
      
      // Validate container ID
      if (!containerId) {
        ws.send(JSON.stringify({ 
          error: "Missing containerId",
          timestamp: new Date().toISOString()
        }));
        ws.close();
        return;
      }

      console.log(`Starting interactive shell for container ${containerId} (${containerName || 'unnamed'})`);
      isAuthenticated = true;

    } catch (parseError) {
      ws.send(JSON.stringify({ 
        error: "Invalid message format",
        timestamp: new Date().toISOString()
      }));
      ws.close();
      return;
    }

    // First, check if container exists and is running
    try {
      console.log(`🔍 Checking container: ${containerId}`);
      const container = docker.getContainer(containerId);
      const containerInfo = await container.inspect();
      
      console.log(`📦 Container status: ${containerInfo.State.Status}`);
      
      if (containerInfo.State.Status !== 'running') {
        const errorMsg = `Container ${containerId} is not running (status: ${containerInfo.State.Status})`;
        console.log(`❌ ${errorMsg}`);
        ws.send(JSON.stringify({ 
          error: errorMsg,
          timestamp: new Date().toISOString()
        }));
        ws.close();
        return;
      }
      
      console.log(`✅ Container ${containerId} is running`);
    } catch (inspectError) {
      console.error(`❌ Container inspect error:`, inspectError.message);
      console.error(`❌ Error details:`, {
        statusCode: inspectError.statusCode,
        json: inspectError.json,
        message: inspectError.message
      });
      ws.send(JSON.stringify({ 
        error: `Container ${containerId} not found or not accessible: ${inspectError.message}`,
        timestamp: new Date().toISOString()
      }));
      ws.close();
      return;
    }

    // Create Docker exec session using dockerode for interactive shell
    console.log(`🐳 Creating interactive shell session for container: ${containerId}`);
    console.log(`🔐 Authenticated user: ${user.email} (role: ${user.role})`);
    
    const container = docker.getContainer(containerId);
    
    // Create an interactive shell session (not tied to the logged-in user)
    // The shell runs as the container's default user (usually root)
    const exec = await container.exec({
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,  // Enable TTY for interactive session
      Cmd: ['/bin/sh']  // Start an interactive shell
    });
    
    const stream = await exec.start({ 
      hijack: true, 
      stdin: true,
      Tty: true
    });
    
    // Store the stream for later use
    shell = { stream, killed: false };
    console.log(`🐳 Interactive shell session created successfully`);
    
    // Send welcome message
    ws.send(JSON.stringify({ 
      output: `✅ Shell connected to container: ${containerName || containerId}\n`,
      timestamp: new Date().toISOString()
    }));

    // Send output from the container to the WebSocket client
    shell.stream.on("data", (data) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ 
          output: data.toString(),
          timestamp: new Date().toISOString()
        }));
      }
    });

    shell.stream.on("error", (error) => {
      console.error("Docker exec stream error:", error);
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ 
          error: error.toString(),
          timestamp: new Date().toISOString()
        }));
      }
    });

    shell.stream.on("end", () => {
      console.log(`🐳 Docker exec stream ended`);
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ 
          message: `Shell session ended`,
          timestamp: new Date().toISOString()
        }));
      }
      shell.killed = true;
      ws.close();
    });

    // Forward subsequent messages as shell input
    ws.on("message", (input) => {
      if (shell && !shell.killed && isAuthenticated) {
        try {
          const inputStr = input.toString();
          // Check if it's a JSON command or raw input
          if (inputStr.startsWith('{')) {
            try {
              const data = JSON.parse(inputStr);
              if (data.command) {
                shell.stream.write(data.command + "\n");
              }
            } catch (parseError) {
              // If JSON parsing fails, treat as raw input
              shell.stream.write(inputStr + "\n");
            }
          } else {
            shell.stream.write(inputStr + "\n");
          }
        } catch (error) {
          console.error("Error writing to shell:", error);
        }
      }
    });
  });

  ws.on("close", () => {
    console.log("❌ WebSocket connection closed");
    if (shell && !shell.killed) {
      try {
        shell.stream.end();
        shell.killed = true;
      } catch (e) {
        console.error("Error closing shell stream:", e);
      }
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
    if (shell && !shell.killed) {
      try {
        shell.stream.end();
        shell.killed = true;
      } catch (e) {
        console.error("Error closing shell stream:", e);
      }
    }
  });
});

// WebSocket heartbeat interval
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log("Terminating inactive WebSocket connection");
      return ws.terminate();
    }
    
    ws.isAlive = false;
    ws.ping();
  });
}, config.wsHeartbeatInterval);

// Clean up on server close
wss.on('close', () => {
  clearInterval(heartbeatInterval);
});

// Connect to database
connectDB();

// Start server
const port = config.https.enabled ? config.https.port : config.port;
const protocol = config.https.enabled ? 'https' : 'http';

server.listen(port, () => {
  console.log(`🚀 Server started at ${protocol}://localhost:${port}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🔗 WebSocket server ready`);
  console.log(`🐳 Docker socket: ${config.dockerSocket}`);
  if (config.https.enabled) {
    console.log(`🔒 HTTPS enabled with CA-signed certificates`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});