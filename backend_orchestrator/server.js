import express from "express";
import { connectDB } from "./config/db.js";
import Container from "./models/containers.model.js";
const app = express();


export const getContainers = async (req, res) => {
    try {
      const containers = await Container.find();
  
      if (!containers || containers.length === 0) {
        throw new Error("No containers found");
      }
   
      res.status(200).json(containers);
    } catch (error) {
      console.error("Error fetching containers:", error.message);
      res.status(500).json({ error: error.message });
    }
  };

app.get("/api/containers", getContainers);

console.log(process.env.MONGO_URI);

app.listen(5000,() => {
    connectDB();
    console.log("Server started at http://localhost:5000 ");
});



