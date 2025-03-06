const mongoose = require("mongoose");

const LogSchema = new mongoose.Schema({
  containerId: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  level: { type: String, enum: ["info", "warning", "error"], required: true }
});

module.exports = mongoose.model("Log", LogSchema);
