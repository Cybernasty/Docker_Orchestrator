import Docker from "dockerode"; 
import Container from "../models/containers.model.js"; 


const docker = new Docker({ socketPath: "\\\\.\\pipe\\docker_engine" }); 



export const syncContainersToDB = async () => {
  try {

    const containers = await docker.listContainers({ all: true });

    for (const container of containers) {

      const containerInfo = await docker.getContainer(container.Id).inspect();
      

      await Container.findOneAndUpdate(
        { containerId: container.Id }, 
        {
          name: container.Names[0],   
          image: container.Image,     
          status: container.Status,   
          cpuUsage: containerInfo.Stats ? containerInfo.Stats.cpu_usage.total_usage : 0,
          memoryUsage: containerInfo.Stats ? containerInfo.Stats.memory_stats.usage : 0,
        },
        { upsert: true } 
      );
    }

    console.log("Containers synced to DB successfully!");
  } catch (error) {
    console.error("Error syncing containers to DB:", error.message);
  }
};

// Call syncContainersToDB every 30 seconds to keep the DB updated
setInterval(syncContainersToDB, 30000);
