import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import containerRoutes from "./routes/containerRoutes.js"; // Import the container routes

const app = express();

app.use(cors());
app.use(express.json());

// Use container-related routes
app.use("/api/containers", containerRoutes);

console.log(process.env.MONGO_URI);

// Connect to the database
connectDB();

app.listen(5000, () => {
  console.log("Server started at http://localhost:5000");
});
