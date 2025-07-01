import express from "express";
import { 
  syncContainersToDB, 
  startContainer, 
  stopContainer, 
  removeContainer,
  fetchContainers,
  getContainerById,
  execCommandInContainer,
  getContainerLogs,
  getContainerStats,
  listImages
} from "../services/dockerService.js";
import { asyncHandler } from "../utils/errors.js";
import { 
  validateContainerOperation, 
  validateCommandExecution,
  validateContainerCreation 
} from "../middleware/validation.js";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Sync containers with database (admin only)
router.get("/sync", authenticateJWT, authorizeRoles("admin"), asyncHandler(async (req, res) => {
  await syncContainersToDB();
  res.status(200).json({ 
    message: "Containers synced successfully",
    timestamp: new Date().toISOString()
  });
}));

// Get all containers (all roles)
router.get("/", authenticateJWT, authorizeRoles("admin", "operator", "viewer"), asyncHandler(async (req, res) => {
  const containers = await fetchContainers();
  res.status(200).json({
    containers,
    count: containers.length,
    timestamp: new Date().toISOString()
  });
}));

// List Docker images (all roles)
router.get("/images", authenticateJWT, authorizeRoles("admin", "operator", "viewer"), asyncHandler(async (req, res) => {
  const images = await listImages();
  res.status(200).json({
    images,
    count: images.length,
    timestamp: new Date().toISOString()
  });
}));

// Get a single container by ID (all roles)
router.get("/:containerId", authenticateJWT, authorizeRoles("admin", "operator", "viewer"), validateContainerOperation, asyncHandler(async (req, res) => {
  const container = await getContainerById(req.params.containerId);
  res.status(200).json({
    container,
    timestamp: new Date().toISOString()
  });
}));

// Get container logs (all roles)
router.get("/:containerId/logs", authenticateJWT, authorizeRoles("admin", "operator", "viewer"), validateContainerOperation, asyncHandler(async (req, res) => {
  const { tail = 100 } = req.query;
  const logs = await getContainerLogs(req.params.containerId, parseInt(tail));
  res.status(200).json({
    logs,
    containerId: req.params.containerId,
    timestamp: new Date().toISOString()
  });
}));

// Get container stats (all roles)
router.get("/:containerId/stats", authenticateJWT, authorizeRoles("admin", "operator", "viewer"), validateContainerOperation, asyncHandler(async (req, res) => {
  const stats = await getContainerStats(req.params.containerId);
  res.status(200).json({
    stats,
    containerId: req.params.containerId,
    timestamp: new Date().toISOString()
  });
}));

// Start a container (admin/operator)
router.post("/:containerId/start", authenticateJWT, authorizeRoles("admin", "operator"), validateContainerOperation, asyncHandler(async (req, res) => {
  await startContainer(req.params.containerId);
  res.status(200).json({ 
    message: "Container started successfully",
    containerId: req.params.containerId,
    timestamp: new Date().toISOString()
  });
}));

// Stop a container (admin/operator)
router.post("/:containerId/stop", authenticateJWT, authorizeRoles("admin", "operator"), validateContainerOperation, asyncHandler(async (req, res) => {
  await stopContainer(req.params.containerId);
  res.status(200).json({ 
    message: "Container stopped successfully",
    containerId: req.params.containerId,
    timestamp: new Date().toISOString()
  });
}));

// Remove a container (admin/operator)
router.delete("/:containerId", authenticateJWT, authorizeRoles("admin", "operator"), validateContainerOperation, asyncHandler(async (req, res) => {
  await removeContainer(req.params.containerId);
  res.status(200).json({ 
    message: "Container removed successfully",
    containerId: req.params.containerId,
    timestamp: new Date().toISOString()
  });
}));

// Execute command in container (admin/operator)
router.post("/:containerId/exec", authenticateJWT, authorizeRoles("admin", "operator"), validateContainerOperation, validateCommandExecution, asyncHandler(async (req, res) => {
  const { command } = req.body;
  const output = await execCommandInContainer(req.params.containerId, command);
  res.status(200).json({ 
    success: true, 
    output,
    command,
    containerId: req.params.containerId,
    timestamp: new Date().toISOString()
  });
}));

export default router;
