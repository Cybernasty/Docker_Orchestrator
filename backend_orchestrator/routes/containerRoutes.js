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

const router = express.Router();

// Sync containers with database
router.get("/sync", asyncHandler(async (req, res) => {
  await syncContainersToDB();
  res.status(200).json({ 
    message: "Containers synced successfully",
    timestamp: new Date().toISOString()
  });
}));

// Get all containers
router.get("/", asyncHandler(async (req, res) => {
  const containers = await fetchContainers();
  res.status(200).json({
    containers,
    count: containers.length,
    timestamp: new Date().toISOString()
  });
}));

// List Docker images
router.get("/images", asyncHandler(async (req, res) => {
  const images = await listImages();
  res.status(200).json({
    images,
    count: images.length,
    timestamp: new Date().toISOString()
  });
}));

// Get a single container by ID
router.get("/:containerId", validateContainerOperation, asyncHandler(async (req, res) => {
  const container = await getContainerById(req.params.containerId);
  res.status(200).json({
    container,
    timestamp: new Date().toISOString()
  });
}));

// Get container logs
router.get("/:containerId/logs", validateContainerOperation, asyncHandler(async (req, res) => {
  const { tail = 100 } = req.query;
  const logs = await getContainerLogs(req.params.containerId, parseInt(tail));
  res.status(200).json({
    logs,
    containerId: req.params.containerId,
    timestamp: new Date().toISOString()
  });
}));

// Get container stats
router.get("/:containerId/stats", validateContainerOperation, asyncHandler(async (req, res) => {
  const stats = await getContainerStats(req.params.containerId);
  res.status(200).json({
    stats,
    containerId: req.params.containerId,
    timestamp: new Date().toISOString()
  });
}));

// Start a container
router.post("/:containerId/start", validateContainerOperation, asyncHandler(async (req, res) => {
  await startContainer(req.params.containerId);
  res.status(200).json({ 
    message: "Container started successfully",
    containerId: req.params.containerId,
    timestamp: new Date().toISOString()
  });
}));

// Stop a container
router.post("/:containerId/stop", validateContainerOperation, asyncHandler(async (req, res) => {
  await stopContainer(req.params.containerId);
  res.status(200).json({ 
    message: "Container stopped successfully",
    containerId: req.params.containerId,
    timestamp: new Date().toISOString()
  });
}));

// Remove a container
router.delete("/:containerId", validateContainerOperation, asyncHandler(async (req, res) => {
  await removeContainer(req.params.containerId);
  res.status(200).json({ 
    message: "Container removed successfully",
    containerId: req.params.containerId,
    timestamp: new Date().toISOString()
  });
}));

// Execute command in container
router.post("/:containerId/exec", validateContainerOperation, validateCommandExecution, asyncHandler(async (req, res) => {
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
