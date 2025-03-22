import express from "express";
import { syncContainersToDB, startContainer, stopContainer, removeContainer } from "../services/dockerService.js";
import Container from "../models/containers.model.js";

const router = express.Router();

router.get("/sync", async (req, res) => {
  try {
    await syncContainersToDB();  
    res.status(200).json({ message: "Containers synced successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to sync containers" });
  }
});

// Retrieve all containers from DB
router.get("/", async (req, res) => {
  try {
    const containers = await Container.find();
    res.status(200).json(containers);
  } catch (error) {
    res.status(500).json({ error: "Error fetching containers" });
  }
});

// ✅ Start a container
router.post("/:id/start", async (req, res) => {
  try {
    await startContainer(req.params.id);
    res.status(200).json({ message: "Container started successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error starting container" });
  }
});

// ✅ Stop a container
router.post("/:id/stop", async (req, res) => {
  try {
    await stopContainer(req.params.id);
    res.status(200).json({ message: "Container stopped successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error stopping container" });
  }
});

// ✅ Remove a container
router.delete("/:id", async (req, res) => {
  try {
    await removeContainer(req.params.id);
    res.status(200).json({ message: "Container removed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error removing container" });
  }
});

export default router;
