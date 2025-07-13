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

// Error handling middleware (must be last)
app.use(errorHandler);

// WebSocket server setup
const wss = new WebSocketServer({ server });

// WebSocket connection handling
wss.on("connection", (ws, req) => {
  // Parse token from query string
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get("token");
  let user = null;

  if (!token) {
    ws.send(JSON.stringify({ error: "Missing authentication token", timestamp: new Date().toISOString() }));
    ws.close();
    return;
  }

  try {
    user = jwt.verify(token, config.jwtSecret);
    // Optionally, you can check user.id/email here
  } catch (err) {
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

  ws.once("message", (message) => {
    let containerId, command;
    try {
      const data = JSON.parse(message);
      ({ containerId, command } = data);
      
      // Validate container ID and command
      if (!containerId || !command) {
        ws.send(JSON.stringify({ 
          error: "Missing containerId or command",
          timestamp: new Date().toISOString()
        }));
        ws.close();
        return;
      }

      console.log(`Executing command: ${command} on container ${containerId}`);
      isAuthenticated = true;

    } catch (parseError) {
      ws.send(JSON.stringify({ 
        error: "Invalid message format",
        timestamp: new Date().toISOString()
      }));
      ws.close();
      return;
    }

    // Spawn Docker exec process
    shell = spawn("docker", [
      "exec",
      "-it",
      containerId,
      "sh"
    ]);

    // Send output from the container to the WebSocket client
    shell.stdout.on("data", (data) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ 
          output: data.toString(),
          timestamp: new Date().toISOString()
        }));
      }
    });

    shell.stderr.on("data", (data) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ 
          error: data.toString(),
          timestamp: new Date().toISOString()
        }));
      }
    });

    shell.on("close", (code) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ 
          message: `Shell closed with code ${code}`,
          timestamp: new Date().toISOString()
        }));
      }
      ws.close();
    });

    shell.on("error", (error) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ 
          error: `Shell error: ${error.message}`,
          timestamp: new Date().toISOString()
        }));
      }
      ws.close();
    });

    // Forward subsequent messages as shell input
    ws.on("message", (input) => {
      if (shell && !shell.killed && isAuthenticated) {
        try {
          const inputStr = input.toString();
          shell.stdin.write(inputStr + "\n");
        } catch (error) {
          console.error("Error writing to shell:", error);
        }
      }
    });
  });

  ws.on("close", () => {
    console.log("❌ WebSocket connection closed");
    if (shell && !shell.killed) {
      shell.kill();
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
    if (shell && !shell.killed) {
      shell.kill();
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