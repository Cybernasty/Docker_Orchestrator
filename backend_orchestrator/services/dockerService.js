import Docker from "dockerode";

const docker = new Docker({ socketPath: "/var/run/docker.sock" });

export const listContainers = async () => {
  return await docker.listContainers({ all: true });
};

export const startContainer = async (id) => {
  const container = docker.getContainer(id);
  return await container.start();
};

export const stopContainer = async (id) => {
  const container = docker.getContainer(id);
  return await container.stop();
};

export const removeContainer = async (id) => {
  const container = docker.getContainer(id);
  return await container.remove();
};
