import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import { WebSocketServer } from "ws";
import { spawn } from "child_process";
import http from "http"; // Create a server to attach WebSockets
import containerRoutes from "./routes/containerRoutes.js"; 

const app = express();
const server = http.createServer(app); // Create an HTTP server
const wss = new WebSocketServer({ server }); // Attach WebSocket to HTTP server

app.use(cors());
app.use(express.json());


app.use("/api/containers", containerRoutes);

console.log(process.env.MONGO_URI);

// Connect to the database
connectDB();



// ✅ WebSocket connection for container shell access
wss.on("connection", (ws, req) => {
  console.log("🔗 New WebSocket connection established");

  ws.on("message", (message) => {
    try {
      const { containerId, command } = JSON.parse(message);
      console.log(`Executing command: ${command} on container ${containerId}`);

      if (!containerId || !command) {
        ws.send(JSON.stringify({ error: "Missing containerId or command" }));
        return;
      }

      // Spawn Docker exec process
      const shell = spawn("docker", [
        "exec",
        "-it",
        containerId,
        "sh"
      ]);

      // Send output from the container to the WebSocket client
      shell.stdout.on("data", (data) => {
        ws.send(JSON.stringify({ output: data.toString() }));
      });

      shell.stderr.on("data", (data) => {
        ws.send(JSON.stringify({ error: data.toString() }));
      });

      shell.on("close", (code) => {
        ws.send(JSON.stringify({ message: `Shell closed with code ${code}` }));
      });

      // Send user input to the container shell
      ws.on("message", (input) => {
        shell.stdin.write(input + "\n");
      });

    } catch (error) {
      ws.send(JSON.stringify({ error: "Invalid message format" }));
    }
  });

  ws.on("close", () => {
    console.log("❌ WebSocket connection closed");
  });
});

app.listen(5000, () => {
  console.log("Server started at http://localhost:5000");
});
