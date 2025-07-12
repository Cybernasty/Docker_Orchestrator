# Container Creation from Dockerfile

This feature allows users with admin or operator roles to create containers directly from Dockerfile content within the application.

## Features

### Frontend
- **Create Container Page**: A comprehensive form for creating containers from Dockerfiles
- **Dockerfile Editor**: Built-in text editor for Dockerfile content
- **Advanced Configuration**: Support for ports, environment variables, volumes, and more
- **Role-based Access**: Only admin and operator roles can access this feature

### Backend
- **Dockerfile Building**: Build Docker images from Dockerfile content
- **Container Creation**: Create containers from built images
- **Comprehensive Options**: Support for all major Docker container options
- **Database Integration**: Store container metadata in MongoDB

## Usage

### Accessing the Feature
1. Navigate to the Containers page
2. Click the "Create Container" button (admin/operator only)
3. Or use the sidebar navigation "Create Container" link

### Creating a Container
1. **Basic Information**:
   - Image Name: The name for your Docker image
   - Container Name: The name for your container
   - Tag: Image tag (defaults to 'latest')

2. **Dockerfile Content**:
   - Write or paste your Dockerfile content
   - Example:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

3. **Port Mappings**:
   - Add host port to container port mappings
   - Select protocol (TCP/UDP)

4. **Environment Variables**:
   - Add key-value pairs for environment variables

5. **Volumes**:
   - Mount host directories to container paths
   - Choose read/write or read-only mode

6. **Advanced Options**:
   - Network mode (bridge, host, none)
   - Restart policy
   - Memory limits
   - CPU shares
   - Working directory
   - Custom command and entrypoint

## API Endpoints

### Build Image from Dockerfile
```
POST /api/containers/build-image
Authorization: Bearer <token>
Content-Type: application/json

{
  "dockerfileContent": "FROM node:18-alpine...",
  "imageName": "my-app",
  "tag": "latest"
}
```

### Create Container from Image
```
POST /api/containers/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "imageName": "my-app:latest",
  "containerName": "my-container",
  "ports": ["8080:3000:tcp"],
  "environment": [{"key": "NODE_ENV", "value": "production"}],
  "volumes": [{"host": "/data", "container": "/app/data", "mode": "rw"}],
  "network": "bridge",
  "restartPolicy": "unless-stopped"
}
```

### Build and Create Container (Combined)
```
POST /api/containers/build-and-create
Authorization: Bearer <token>
Content-Type: application/json

{
  "dockerfileContent": "FROM node:18-alpine...",
  "imageName": "my-app",
  "containerName": "my-container",
  "tag": "latest",
  "ports": ["8080:3000:tcp"],
  "environment": [{"key": "NODE_ENV", "value": "production"}],
  "volumes": [{"host": "/data", "container": "/app/data", "mode": "rw"}],
  "network": "bridge",
  "restartPolicy": "unless-stopped",
  "memory": 512,
  "cpuShares": 1024
}
```

## Security

- **Role-based Access**: Only admin and operator roles can create containers
- **Input Validation**: All inputs are validated and sanitized
- **Docker Security**: Uses Docker's built-in security features
- **Temporary Files**: Dockerfile content is written to temporary files and cleaned up

## Dependencies

### Backend
- `tar`: For creating Docker build context
- `dockerode`: For Docker API interaction
- `mongoose`: For database operations

### Frontend
- `react-router-dom`: For navigation
- `axios`: For API calls
- `react-icons`: For UI icons

## Error Handling

The application includes comprehensive error handling:
- Docker daemon availability checks
- Build process monitoring
- Container creation validation
- Database operation error handling
- User-friendly error messages

## Database Schema

The Container model has been extended to include:
- `volumes`: Array of volume mappings
- `network`: Network mode
- `restartPolicy`: Container restart policy
- `memory`: Memory limit in MB
- `cpuShares`: CPU shares allocation
- `workingDir`: Working directory
- `command`: Custom command
- `entrypoint`: Custom entrypoint

## Future Enhancements

- Template system for common Dockerfile patterns
- Build progress monitoring
- Multi-stage build support
- Build cache management
- Container health checks
- Resource usage monitoring 