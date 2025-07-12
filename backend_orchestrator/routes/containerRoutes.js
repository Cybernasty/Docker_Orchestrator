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
  listImages,
  buildImageFromDockerfile,
  createContainerFromImage,
  buildAndCreateContainer
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

// Build image from Dockerfile (admin/operator)
router.post("/build-image", authenticateJWT, authorizeRoles("admin", "operator"), asyncHandler(async (req, res) => {
  const { dockerfileContent, imageName, tag = 'latest' } = req.body;
  
  if (!dockerfileContent || !imageName) {
    return res.status(400).json({
      error: {
        message: "Dockerfile content and image name are required"
      }
    });
  }
  
  const result = await buildImageFromDockerfile(dockerfileContent, imageName, tag);
  res.status(200).json({
    message: "Image built successfully",
    imageName: `${imageName}:${tag}`,
    output: result.output,
    timestamp: new Date().toISOString()
  });
}));

// Create container from image (admin/operator)
router.post("/create", authenticateJWT, authorizeRoles("admin", "operator"), asyncHandler(async (req, res) => {
  const { 
    imageName, 
    containerName, 
    ports = [], 
    environment = [], 
    volumes = [],
    network = 'bridge',
    restartPolicy = 'no',
    memory = null,
    cpuShares = null,
    workingDir = null,
    command = null,
    entrypoint = null
  } = req.body;
  
  console.log('Received create container request:', { imageName, containerName, ports, environment, volumes });
  
  if (!imageName || !containerName) {
    return res.status(400).json({
      error: {
        message: "Image name and container name are required"
      }
    });
  }
  
  const options = {
    ports,
    environment,
    volumes,
    network,
    restartPolicy,
    memory,
    cpuShares,
    workingDir,
    command,
    entrypoint
  };
  
  const container = await createContainerFromImage(imageName, containerName, options);
  res.status(201).json({
    message: "Container created successfully",
    container,
    timestamp: new Date().toISOString()
  });
}));

// Build and create container from Dockerfile (admin/operator)
router.post("/build-and-create", authenticateJWT, authorizeRoles("admin", "operator"), asyncHandler(async (req, res) => {
  const { 
    dockerfileContent, 
    imageName, 
    containerName, 
    tag = 'latest',
    ports = [], 
    environment = [], 
    volumes = [],
    network = 'bridge',
    restartPolicy = 'no',
    memory = null,
    cpuShares = null,
    workingDir = null,
    command = null,
    entrypoint = null
  } = req.body;
  
  if (!dockerfileContent || !imageName || !containerName) {
    return res.status(400).json({
      error: {
        message: "Dockerfile content, image name, and container name are required"
      }
    });
  }
  
  const options = {
    tag,
    ports,
    environment,
    volumes,
    network,
    restartPolicy,
    memory,
    cpuShares,
    workingDir,
    command,
    entrypoint
  };
  
  const container = await buildAndCreateContainer(dockerfileContent, imageName, containerName, options);
  res.status(201).json({
    message: "Container built and created successfully",
    container,
    timestamp: new Date().toISOString()
  });
}));

export default router;
