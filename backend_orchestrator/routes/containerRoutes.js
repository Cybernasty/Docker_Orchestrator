import express from "express";
import { listContainers, startContainer, stopContainer, removeContainer } from "../services/dockerService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const containers = await listContainers();
    res.json(containers);
  } catch (error) {
    res.status(500).json({ error: "Error fetching containers" });
  }
});

router.post("/:id/start", async (req, res) => {
  try {
    await startContainer(req.params.id);
    res.json({ message: "Container started" });
  } catch (error) {
    res.status(500).json({ error: "Failed to start container" });
  }
});

router.post("/:id/stop", async (req, res) => {
  try {
    await stopContainer(req.params.id);
    res.json({ message: "Container stopped" });
  } catch (error) {
    res.status(500).json({ error: "Failed to stop container" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await removeContainer(req.params.id);
    res.json({ message: "Container removed" });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove container" });
  }
});

export default router;
