const mongoose = require("mongoose");

const MetricsSchema = new mongoose.Schema({
  containerId: { type: String, required: true },
  cpuUsage: { type: Number, required: true }, // %
  memoryUsage: { type: Number, required: true }, // MB
  networkTraffic: { type: Number, required: true }, // KB/s
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Metrics", MetricsSchema);
