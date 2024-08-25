// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./db/connection.js";
import routes from "./routes/noteRoutes.js";
import { connectRedis } from "./redisClient.js"; // Import Redis connection function

dotenv.config(); // Load environment variables from .env file

const app = express();

// Enable CORS
app.use(
  cors({
    origin: "http://localhost:3000", // Replace with your React app URL
    credentials: true, // Enable sending cookies with requests
  })
);

app.use(express.json()); // Middleware to parse JSON
app.use("/api", routes); // Use the routes

connectDB(); // Connect to MongoDB

// Connect to Redis
connectRedis()
  .then(() => {
    // Start the server after Redis is connected
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Could not connect to Redis", err);
  });
