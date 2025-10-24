import express from "express";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import { asyncHandler } from "../utils/errors.js";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Helper to sign JWT
const signToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

// Register
router.post("/register", asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: { message: "Email and password are required" } });
  }
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ error: { message: "Email already registered" } });
  }
  const user = new User({ email, password });
  await user.save();
  const token = signToken(user);
  res.status(201).json({
    message: "Registration successful",
    token,
    user: { id: user._id, email: user.email, role: user.role }
  });
}));

// Login
router.post("/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: { message: "Email and password are required" } });
  }
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ error: { message: "Invalid credentials" } });
  }
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ error: { message: "Invalid credentials" } });
  }
  const token = signToken(user);
  res.status(200).json({
    message: "Login successful",
    token,
    user: { id: user._id, email: user.email, role: user.role }
  });
}));

// Add User (Admin only)
router.post("/add-user", authenticateJWT, authorizeRoles("admin"), asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ error: { message: "Email, password, and role are required" } });
  }
  if (!["admin", "operator", "viewer"].includes(role)) {
    return res.status(400).json({ error: { message: "Invalid role" } });
  }
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ error: { message: "Email already registered" } });
  }
  const user = new User({ email, password, role });
  await user.save();
  res.status(201).json({
    message: "User created successfully",
    user: { id: user._id, email: user.email, role: user.role }
  });
}));

// Get all users (Admin only)
router.get("/users", authenticateJWT, authorizeRoles("admin"), asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");
  res.status(200).json({
    users,
    count: users.length,
    timestamp: new Date().toISOString()
  });
}));

// Update user (Admin only)
router.put("/users/:userId", authenticateJWT, authorizeRoles("admin"), asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;
  const { userId } = req.params;
  
  // Validate role if provided
  if (role && !["admin", "operator", "viewer"].includes(role)) {
    return res.status(400).json({ error: { message: "Invalid role" } });
  }
  
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ error: { message: "User not found" } });
  }
  
  // Check if email is being changed and if it's already taken
  if (email && email !== user.email) {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: { message: "Email already in use" } });
    }
    user.email = email;
  }
  
  // Update password if provided
  if (password) {
    user.password = password; // Will be hashed by pre-save hook
  }
  
  // Update role if provided
  if (role) {
    user.role = role;
  }
  
  await user.save();
  
  res.status(200).json({
    message: "User updated successfully",
    user: { id: user._id, email: user.email, role: user.role }
  });
}));

// Delete user (Admin only)
router.delete("/users/:userId", authenticateJWT, authorizeRoles("admin"), asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  // Prevent admin from deleting themselves
  if (userId === req.user._id.toString()) {
    return res.status(400).json({ error: { message: "Cannot delete your own account" } });
  }
  
  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    return res.status(404).json({ error: { message: "User not found" } });
  }
  
  res.status(200).json({
    message: "User deleted successfully",
    deletedUser: { id: user._id, email: user.email }
  });
}));

export default router; 