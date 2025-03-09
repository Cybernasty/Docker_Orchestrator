import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import Container from "./models/containers.model.js";



const app = express();


app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to the API");
  });

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
    console.log("Server started at http://localhost:5000");
});

// import express from "express"; 
// import cors from "cors";
// import { connectDB } from "./config/db.js";
// import Container from "./models/containers.model.js";

// const app = express();

// app.use(cors());
// app.use(express.json());

// connectDB(); 

// // Route to list all containers (running + stopped)
// app.get("/", async (req, res) => {
//     try {
//         const containers = await Container.find();
        
//         if (!containers || containers.length === 0) {
//             throw new Error("No containers found");
//         }

//         res.status(200).json(containers);
//     } catch (error) {
//         console.error("Error fetching containers:", error.message);
//         res.status(500).json({ error: error.message });
//     }
// });

// // Route to start a container
// app.post("/start/:id", async (req, res) => {
//   try {
//       await startContainer(req.params.id);
//       res.status(200).json({ message: `Container ${req.params.id} started successfully` });
//   } catch (error) {
//       console.error(`Error starting container ${req.params.id}:`, error.message);
//       res.status(500).json({ error: error.message });
//   }
// });
// // Route to stop a container
// app.post("/stop/:id", async (req, res) => {
//   try {
//       await stopContainer(req.params.id);
//       res.status(200).json({ message: `Container ${req.params.id} stopped successfully` });
//   } catch (error) {
//       console.error(`Error stopping container ${req.params.id}:`, error.message);
//       res.status(500).json({ error: error.message });
//   }
// });
// // Route to remove a container
// app.delete("/remove/:id", async (req, res) => {
//   try {
//       await removeContainer(req.params.id);
//       res.status(200).json({ message: `Container ${req.params.id} removed successfully` });
//   } catch (error) {
//       console.error(`Error removing container ${req.params.id}:`, error.message);
//       res.status(500).json({ error: error.message });
//   }
// });


// console.log("MongoDB URI:", process.env.MONGO_URI);

// app.listen(5000, () => {
//     console.log("Server started at http://localhost:5000");
// });


// import express from "express"; 
// import cors from "cors";
// import { connectDB } from "./config/db.js";
// import containerRoutes from "./routes/containerRoutes.js"; // Import Docker routes
// import { syncContainersToDB } from "./services/dockerService.js"; // Sync function

// const app = express();

// app.use(cors());
// app.use(express.json());

// connectDB(); // Connect to MongoDB

// // Use the container routes
// app.use("/api/containers", containerRoutes);

// // Run syncing every 30 seconds to update MongoDB
// setInterval(syncContainersToDB, 30000);

// console.log("MongoDB URI:", process.env.MONGO_URI);

// app.listen(5000, () => {
//     console.log("Server started at http://localhost:5000");
//     syncContainersToDB(); // Run sync on startup
// });
