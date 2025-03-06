import mongoose from "mongoose";

const ContainerSchema = new mongoose.Schema({
  containerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  status: { type: String, enum: ["running", "stopped", "restarting", "exited"], required: true },
  createdAt: { type: Date, default: Date.now },
  site: { type: mongoose.Schema.Types.ObjectId, ref: "Site", required: true },
  cpuUsage: { type: Number, default: null },
  memoryUsage: { type: Number, default: null },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
});

const Container = mongoose.model("Container", ContainerSchema);
export default Container;

