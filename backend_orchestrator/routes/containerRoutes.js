import express from "express";
import { syncContainersToDB } from "../services/dockerService.js"; // Import the sync function

const router = express.Router();

// Route to manually trigger syncing containers to the DB (optional)
router.get("/sync", async (req, res) => {
  try {
    await syncContainersToDB();  // Sync containers manually if needed
    res.status(200).json({ message: "Containers synced successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to sync containers" });
  }
});

// Other existing routes for container management, if needed
// For example, fetching containers from MongoDB
router.get("/", async (req, res) => {
  try {
    const containers = await Container.find();
    res.status(200).json(containers);
  } catch (error) {
    res.status(500).json({ error: "Error fetching containers" });
  }
});

export default router;
