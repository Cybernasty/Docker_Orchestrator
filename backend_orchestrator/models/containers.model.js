import mongoose from "mongoose";

const ContainerSchema = new mongoose.Schema({
  containerId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  image: { 
    type: String, 
    required: true,
    trim: true 
  },
  status: { 
    type: String, 
    enum: ["running", "stopped", "restarting", "exited", "created", "paused"], 
    required: true,
    default: "created"
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  site: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Site", 
    required: false // Made optional for now
  },
  cpuUsage: { 
    type: Number, 
    default: 0 
  },
  memoryUsage: { 
    type: Number, 
    default: 0 
  },
  memoryLimit: { 
    type: Number, 
    default: 0 
  },
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: false // Made optional for now
  },
  ports: [{
    hostPort: String,
    containerPort: String,
    protocol: { type: String, enum: ["tcp", "udp"], default: "tcp" }
  }],
  environment: [{
    key: String,
    value: String
  }],
  volumes: [{
    host: String,
    container: String,
    mode: { type: String, enum: ["rw", "ro"], default: "rw" }
  }],
  network: {
    type: String,
    default: "bridge"
  },
  restartPolicy: {
    type: String,
    enum: ["no", "always", "unless-stopped", "on-failure"],
    default: "no"
  },
  memory: {
    type: Number,
    default: null
  },
  cpuShares: {
    type: Number,
    default: null
  },
  workingDir: {
    type: String,
    default: null
  },
  command: {
    type: String,
    default: null
  },
  entrypoint: {
    type: String,
    default: null
  }
}, {
  timestamps: true // Automatically manage createdAt and updatedAt
});

// Add indexes for better query performance
ContainerSchema.index({ status: 1 });
ContainerSchema.index({ createdAt: -1 });

const Container = mongoose.model("Container", ContainerSchema);
export default Container;

