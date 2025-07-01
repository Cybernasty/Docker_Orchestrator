import Docker from "dockerode";
import Container from "../models/containers.model.js";
import config from "../config/config.js";
import { DockerError, ContainerError, NotFoundError } from "../utils/errors.js";

// Initialize Docker with cross-platform socket path
const docker = new Docker({ socketPath: config.dockerSocket });

// Check Docker daemon availability
export const checkDockerDaemon = async () => {
  try {
    await docker.ping();
    console.log("✅ Docker daemon is available");
    return true;
  } catch (error) {
    console.error("❌ Docker daemon is not available:", error.message);
    throw new DockerError("Docker daemon is not available", 503, "ping");
  }
};

// Sync containers to the database
export const syncContainersToDB = async () => {
  try {
    // Check Docker daemon first
    await checkDockerDaemon();
    
    // Fetch all containers (including stopped ones)
    const containers = await docker.listContainers({ all: true });
    
    console.log(`🔄 Syncing ${containers.length} containers to database...`);

    for (const container of containers) {
      try {
        // Inspect the container for detailed stats
        const containerInfo = await docker.getContainer(container.Id).inspect();
        
        // Extract port mappings
        const ports = [];
        if (containerInfo.NetworkSettings && containerInfo.NetworkSettings.Ports) {
          Object.entries(containerInfo.NetworkSettings.Ports).forEach(([containerPort, hostBindings]) => {
            if (hostBindings && hostBindings.length > 0) {
              const [hostPort] = containerPort.split('/');
              const [protocol] = containerPort.split('/').slice(-1);
              ports.push({
                hostPort: hostBindings[0].HostPort,
                containerPort: hostPort,
                protocol: protocol || 'tcp'
              });
            }
          });
        }

        // Extract environment variables
        const environment = [];
        if (containerInfo.Config && containerInfo.Config.Env) {
          containerInfo.Config.Env.forEach(envVar => {
            const [key, ...valueParts] = envVar.split('=');
            environment.push({
              key,
              value: valueParts.join('=')
            });
          });
        }

        // Get container stats for resource usage
        let cpuUsage = 0;
        let memoryUsage = 0;
        let memoryLimit = 0;
        
        try {
          const stats = await docker.getContainer(container.Id).stats({ stream: false });
          if (stats) {
            // Calculate CPU usage percentage
            const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
            const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
            cpuUsage = systemDelta > 0 ? (cpuDelta / systemDelta) * 100 : 0;
            
            // Memory usage
            memoryUsage = stats.memory_stats.usage || 0;
            memoryLimit = stats.memory_stats.limit || 0;
          }
        } catch (statsError) {
          console.warn(`⚠️ Could not get stats for container ${container.Id}:`, statsError.message);
        }

        await Container.findOneAndUpdate(
          { containerId: container.Id },
          {
            name: container.Names[0]?.replace(/^\//, '') || container.Id.substring(0, 12),
            image: container.Image,
            status: container.State,
            cpuUsage: Math.round(cpuUsage * 100) / 100, // Round to 2 decimal places
            memoryUsage,
            memoryLimit,
            ports,
            environment,
            updatedAt: new Date()
          },
          { upsert: true, new: true }
        );
      } catch (containerError) {
        console.error(`❌ Error syncing container ${container.Id}:`, containerError.message);
        // Continue with other containers
      }
    }

    console.log("✅ Containers synced to DB successfully!");
  } catch (error) {
    console.error("❌ Error syncing containers to DB:", error.message);
    throw new DockerError(`Failed to sync containers: ${error.message}`, 500, "sync");
  }
};

// Fetch containers from the database
export const fetchContainers = async () => {
  try {
    const containers = await Container.find().sort({ createdAt: -1 });
    return containers;
  } catch (error) {
    console.error("❌ Error fetching containers from DB:", error.message);
    throw new ContainerError(`Failed to fetch containers: ${error.message}`, 500);
  }
};

// Get a single container by ID
export const getContainerById = async (containerId) => {
  try {
    const container = await Container.findOne({ containerId });
    if (!container) {
      throw new NotFoundError(`Container ${containerId}`);
    }
    return container;
  } catch (error) {
    if (error.name === 'NotFoundError') {
      throw error;
    }
    throw new ContainerError(`Failed to get container: ${error.message}`, 500, containerId);
  }
};

// Start a container
export const startContainer = async (containerId) => {
  try {
    const container = docker.getContainer(containerId);
    
    // Check if container exists
    try {
      await container.inspect();
    } catch (inspectError) {
      throw new NotFoundError(`Container ${containerId}`);
    }
    
    await container.start();
    
    // Update status in DB
    await Container.findOneAndUpdate(
      { containerId },
      { 
        status: "running",
        updatedAt: new Date()
      }
    );

    console.log(`✅ Container ${containerId} started successfully`);
  } catch (error) {
    if (error.name === 'NotFoundError') {
      throw error;
    }
    console.error(`❌ Error starting container ${containerId}:`, error.message);
    throw new DockerError(`Failed to start container: ${error.message}`, 500, "start");
  }
};

// Stop a container
export const stopContainer = async (containerId) => {
  try {
    const container = docker.getContainer(containerId);
    
    // Check if container exists
    try {
      await container.inspect();
    } catch (inspectError) {
      throw new NotFoundError(`Container ${containerId}`);
    }
    
    await container.stop();

    // Update status in DB
    await Container.findOneAndUpdate(
      { containerId },
      { 
        status: "stopped",
        updatedAt: new Date()
      }
    );

    console.log(`✅ Container ${containerId} stopped successfully`);
  } catch (error) {
    if (error.name === 'NotFoundError') {
      throw error;
    }
    console.error(`❌ Error stopping container ${containerId}:`, error.message);
    throw new DockerError(`Failed to stop container: ${error.message}`, 500, "stop");
  }
};

// Remove a container
export const removeContainer = async (containerId) => {
  try {
    const container = docker.getContainer(containerId);
    
    // Check if container exists
    try {
      await container.inspect();
    } catch (inspectError) {
      throw new NotFoundError(`Container ${containerId}`);
    }
    
    await container.remove({ force: true });

    // Remove from database
    await Container.deleteOne({ containerId });

    console.log(`✅ Container ${containerId} removed successfully`);
  } catch (error) {
    if (error.name === 'NotFoundError') {
      throw error;
    }
    console.error(`❌ Error removing container ${containerId}:`, error.message);
    throw new DockerError(`Failed to remove container: ${error.message}`, 500, "remove");
  }
};

// Execute command in container
export const execCommandInContainer = async (containerId, command) => {
  try {
    const container = docker.getContainer(containerId);
    
    // Check if container exists and is running
    const containerInfo = await container.inspect();
    if (containerInfo.State.Status !== 'running') {
      throw new ContainerError(`Container ${containerId} is not running`, 400, containerId);
    }

    // Create an exec instance in the container
    const exec = await container.exec({
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
      Cmd: ["/bin/sh", "-c", command],
    });

    // Start the exec session and capture output
    const stream = await exec.start({ stdin: true });

    return new Promise((resolve, reject) => {
      let output = "";
      let errorOutput = "";
      
      stream.on("data", (chunk) => {
        const data = chunk.toString();
        // Docker exec output includes headers, we need to parse them
        if (data.length > 8) {
          // Skip the first 8 bytes (Docker stream header)
          output += data.substring(8);
        }
      });

      stream.on("end", () => {
        resolve(output.trim());
      });

      stream.on("error", (err) => {
        reject(new DockerError(`Error executing command: ${err.message}`, 500, "exec"));
      });

      // Set a timeout for command execution
      setTimeout(() => {
        reject(new DockerError("Command execution timeout", 408, "exec"));
      }, 30000); // 30 second timeout
    });

  } catch (error) {
    if (error.name === 'ContainerError' || error.name === 'DockerError') {
      throw error;
    }
    console.error(`❌ Error executing command in container ${containerId}:`, error.message);
    throw new DockerError(`Failed to execute command: ${error.message}`, 500, "exec");
  }
};

// Get container logs
export const getContainerLogs = async (containerId, tail = 100) => {
  try {
    const container = docker.getContainer(containerId);
    
    // Check if container exists
    try {
      await container.inspect();
    } catch (inspectError) {
      throw new NotFoundError(`Container ${containerId}`);
    }
    
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      tail: tail,
      timestamps: true
    });
    
    return logs.toString();
  } catch (error) {
    if (error.name === 'NotFoundError') {
      throw error;
    }
    throw new DockerError(`Failed to get container logs: ${error.message}`, 500, "logs");
  }
};

// Get container stats
export const getContainerStats = async (containerId) => {
  try {
    const container = docker.getContainer(containerId);
    
    // Check if container exists
    try {
      await container.inspect();
    } catch (inspectError) {
      throw new NotFoundError(`Container ${containerId}`);
    }
    
    const stats = await container.stats({ stream: false });
    
    if (!stats) {
      throw new DockerError("Could not retrieve container stats", 500, "stats");
    }
    
    // Calculate CPU usage percentage
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    const cpuUsage = systemDelta > 0 ? (cpuDelta / systemDelta) * 100 : 0;
    
    return {
      cpu: {
        usage: Math.round(cpuUsage * 100) / 100,
        total: stats.cpu_stats.cpu_usage.total_usage,
        system: stats.cpu_stats.system_cpu_usage
      },
      memory: {
        usage: stats.memory_stats.usage || 0,
        limit: stats.memory_stats.limit || 0,
        percentage: stats.memory_stats.limit > 0 ? 
          Math.round((stats.memory_stats.usage / stats.memory_stats.limit) * 100 * 100) / 100 : 0
      },
      network: stats.networks || {},
      timestamp: new Date()
    };
  } catch (error) {
    if (error.name === 'NotFoundError') {
      throw error;
    }
    throw new DockerError(`Failed to get container stats: ${error.message}`, 500, "stats");
  }
};

// Automatically sync containers based on config
setInterval(syncContainersToDB, config.syncInterval);

// List Docker images
export const listImages = async () => {
  try {
    await checkDockerDaemon();
    const images = await docker.listImages();
    return images;
  } catch (error) {
    console.error("❌ Error listing images:", error.message);
    throw new DockerError(`Failed to list images: ${error.message}`, 500, "images");
  }
};
