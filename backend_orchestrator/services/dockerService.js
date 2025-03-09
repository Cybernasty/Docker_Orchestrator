import Docker from "dockerode"; // Import Dockerode
import Container from "../models/containers.model.js"; // Make sure the path is correct

// Initialize Dockerode
const docker = new Docker({ socketPath: "\\\\.\\pipe\\docker_engine" }); // For Linux/macOS
// For Windows, use this path: 

// Function to sync containers data to MongoDB
export const syncContainersToDB = async () => {
  try {
    // Fetch the list of containers (including stopped ones)
    const containers = await docker.listContainers({ all: true });

    // Loop through each container and save/update them in MongoDB
    for (const container of containers) {
      // Get additional details about each container
      const containerInfo = await docker.getContainer(container.Id).inspect();
      
      // Save container details into MongoDB
      await Container.findOneAndUpdate(
        { containerId: container.Id }, // Unique identifier
        {
          name: container.Names[0],   // Container name
          image: container.Image,     // Image used
          status: container.Status,   // Current status (running, stopped, etc.)
          cpuUsage: containerInfo.Stats ? containerInfo.Stats.cpu_usage.total_usage : 0,
          memoryUsage: containerInfo.Stats ? containerInfo.Stats.memory_stats.usage : 0,
        },
        { upsert: true } // If container not found, insert, else update
      );
    }

    console.log("Containers synced to DB successfully!");
  } catch (error) {
    console.error("Error syncing containers to DB:", error.message);
  }
};

// Call syncContainersToDB every 30 seconds to keep the DB updated
setInterval(syncContainersToDB, 30000);
