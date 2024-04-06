const express = require("express");
const cors = require("cors");
const { getShipments } = require("./mongodb");

// Instance of Express 
const app = express();

const port = process.env.PORT || 4000;

// Define the allowed origins for CORS
const allowedOrigins = ["http://localhost:3000"];

// Set up CORS middleware
app.use(
  cors({
    origin: allowedOrigins,
  })
);

// Middleware to parse incoming requests with JSON payloads
app.use(express.json());

// Async function to fetch shipments from MongoDB
const fetchShipments = async () => {
  try {
    return await getShipments();
  } catch (error) {
    console.error("Error fetching shipments:", error);
    return [];
  }
};

// Route handler for GET requests to "/api/shipments"
app.get("/api/shipments", async (req, res) => {
  try {
    // Fetch shipments from MongoDB
    const shipments = await fetchShipments();
    // Respond with shipments data as JSON
    res.json(shipments);
  } catch (error) {
    // Handle errors
    console.error("Error handling shipments request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
