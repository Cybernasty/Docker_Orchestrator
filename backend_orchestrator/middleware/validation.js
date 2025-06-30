import { ValidationError } from '../utils/errors.js';

// Basic input sanitization
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

// Validate container ID format
export const validateContainerId = (containerId) => {
  if (!containerId || typeof containerId !== 'string') {
    throw new ValidationError('Container ID is required and must be a string', 'containerId');
  }
  
  // Docker container IDs are typically 64 character hex strings
  // But they can also be shorter (12+ characters)
  const containerIdRegex = /^[a-f0-9]{12,64}$/i;
  if (!containerIdRegex.test(containerId)) {
    throw new ValidationError('Invalid container ID format', 'containerId');
  }
  
  return sanitizeInput(containerId);
};

// Validate command input
export const validateCommand = (command) => {
  if (!command || typeof command !== 'string') {
    throw new ValidationError('Command is required and must be a string', 'command');
  }
  
  const sanitizedCommand = sanitizeInput(command);
  
  // Check for potentially dangerous commands
  const dangerousCommands = [
    'rm -rf /',
    'dd if=/dev/zero',
    'mkfs',
    'fdisk',
    'format',
    'del /s /q',
    'format c:'
  ];
  
  const lowerCommand = sanitizedCommand.toLowerCase();
  for (const dangerousCmd of dangerousCommands) {
    if (lowerCommand.includes(dangerousCmd)) {
      throw new ValidationError('Potentially dangerous command detected', 'command');
    }
  }
  
  return sanitizedCommand;
};

// Validate port numbers
export const validatePort = (port) => {
  const portNum = parseInt(port);
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    throw new ValidationError('Port must be a number between 1 and 65535', 'port');
  }
  return portNum;
};

// Validate container name
export const validateContainerName = (name) => {
  if (!name || typeof name !== 'string') {
    throw new ValidationError('Container name is required and must be a string', 'name');
  }
  
  const sanitizedName = sanitizeInput(name);
  
  // Docker container name validation
  const nameRegex = /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/;
  if (!nameRegex.test(sanitizedName)) {
    throw new ValidationError('Invalid container name format', 'name');
  }
  
  if (sanitizedName.length > 128) {
    throw new ValidationError('Container name too long (max 128 characters)', 'name');
  }
  
  return sanitizedName;
};

// Validate image name
export const validateImageName = (image) => {
  if (!image || typeof image !== 'string') {
    throw new ValidationError('Image name is required and must be a string', 'image');
  }
  
  const sanitizedImage = sanitizeInput(image);
  
  // Basic Docker image name validation
  const imageRegex = /^[a-zA-Z0-9][a-zA-Z0-9_.-]*(\/[a-zA-Z0-9][a-zA-Z0-9_.-]*)*(:[a-zA-Z0-9_.-]+)?$/;
  if (!imageRegex.test(sanitizedImage)) {
    throw new ValidationError('Invalid image name format', 'image');
  }
  
  return sanitizedImage;
};

// Middleware for validating container operations
export const validateContainerOperation = (req, res, next) => {
  try {
    const { containerId } = req.params;
    if (containerId) {
      req.params.containerId = validateContainerId(containerId);
    }
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware for validating command execution
export const validateCommandExecution = (req, res, next) => {
  try {
    const { command } = req.body;
    if (command) {
      req.body.command = validateCommand(command);
    }
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware for validating container creation
export const validateContainerCreation = (req, res, next) => {
  try {
    const { name, image, ports, environment } = req.body;
    
    if (name) {
      req.body.name = validateContainerName(name);
    }
    
    if (image) {
      req.body.image = validateImageName(image);
    }
    
    if (ports && Array.isArray(ports)) {
      req.body.ports = ports.map(port => ({
        hostPort: validatePort(port.hostPort),
        containerPort: validatePort(port.containerPort),
        protocol: port.protocol === 'udp' ? 'udp' : 'tcp'
      }));
    }
    
    if (environment && Array.isArray(environment)) {
      req.body.environment = environment.map(env => ({
        key: sanitizeInput(env.key),
        value: sanitizeInput(env.value)
      }));
    }
    
    next();
  } catch (error) {
    next(error);
  }
}; 