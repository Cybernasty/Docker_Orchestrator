import express from "express";
import { syncContainersToDB } from "../services/dockerService.js";

const router = express.Router();


router.get("/sync", async (req, res) => {
  try {
    await syncContainersToDB();  
    res.status(200).json({ message: "Containers synced successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to sync containers" });
  }
});


router.get("/", async (req, res) => {
  try {
    const containers = await Container.find();
    res.status(200).json(containers);
  } catch (error) {
    res.status(500).json({ error: "Error fetching containers" });
  }
});

export default router;
