import express from "express";
import { connectDB } from "./config/db.js";


const app = express();

app.get("/", (req,res) => {
    res.send("Server is ready")
})

console.log(process.env.MONGO_URI);

app.listen(5000,() => {
    connectDB();
    console.log("Server started at http://localhost:5000 ");
});



