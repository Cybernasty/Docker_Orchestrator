const mongoose = require("mongoose");

const SiteSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  location: { type: String, required: true },
  ipAddress: { type: String, required: true },
  containers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Container" }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Site", SiteSchema);
