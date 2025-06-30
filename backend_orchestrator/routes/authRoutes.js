import express from "express";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import { asyncHandler } from "../utils/errors.js";

const router = express.Router();

// Helper to sign JWT
const signToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
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
    user: { id: user._id, email: user.email }
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
    user: { id: user._id, email: user.email }
  });
}));

export default router; 