import Docker from "dockerode";
import Container from "../models/containers.model.js"; 

const docker = new Docker({ socketPath: "\\\\.\\pipe\\docker_engine" });

// ✅ Sync containers to the database
export const syncContainersToDB = async () => {
  try {
    // Fetch all containers (including stopped ones)
    const containers = await docker.listContainers({ all: true });

    for (const container of containers) {
      // Inspect the container for detailed stats
      const containerInfo = await docker.getContainer(container.Id).inspect();

      await Container.findOneAndUpdate(
        { containerId: container.Id },
        {
          name: container.Names[0],   
          image: container.Image,     
          status: container.State,  
          cpuUsage: containerInfo.Stats ? containerInfo.Stats.cpu_usage.total_usage : 0,
          memoryUsage: containerInfo.Stats ? containerInfo.Stats.memory_stats.usage : 0,
        },
        { upsert: true }
      );
    }

    console.log("✅ Containers synced to DB successfully!");
  } catch (error) {
    console.error("❌ Error syncing containers to DB:", error.message);
  }
};

// ✅ Fetch containers from the database
export const fetchContainers = async () => {
  try {
    const containers = await Container.find();
    return containers;
  } catch (error) {
    console.error("❌ Error fetching containers from DB:", error.message);
    throw error;
  }
};

// ✅ Start a container
export const startContainer = async (containerId) => {
  try {
    const container = docker.getContainer(containerId);
    await container.start();
    
    // Update status in DB
    await Container.findOneAndUpdate(
      { containerId },
      { status: "running" }
    );

    console.log(`✅ Container ${containerId} started.`);
  } catch (error) {
    console.error(`❌ Error starting container ${containerId}:`, error.message);
    throw error;
  }
};

// ✅ Stop a container
export const stopContainer = async (containerId) => {
  try {
    const container = docker.getContainer(containerId);
    await container.stop();

    // Update status in DB
    await Container.findOneAndUpdate(
      { containerId },
      { status: "stopped" }
    );

    console.log(`✅ Container ${containerId} stopped.`);
  } catch (error) {
    console.error(`❌ Error stopping container ${containerId}:`, error.message);
    throw error;
  }
};

// ✅ Remove a container
export const removeContainer = async (containerId) => {
  try {
    const container = docker.getContainer(containerId);
    await container.remove();

    // Remove from database
    await Container.deleteOne({ containerId });

    console.log(`✅ Container ${containerId} removed.`);
  } catch (error) {
    console.error(`❌ Error removing container ${containerId}:`, error.message);
    throw error;
  }
};

// ✅ Automatically sync containers every 30 seconds
setInterval(syncContainersToDB, 30000);
