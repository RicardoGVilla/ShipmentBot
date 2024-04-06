const express = require("express");
const app = express();
const port = process.env.PORT || 4000;
const cors = require("cors");
const { getShipments } = require("./mongodb");


// Define an async function to fetch shipments
const fetchShipments = async () => {
  try {
    return await getShipments();
  } catch (error) {
    console.error("Error fetching shipments:", error);
    return [];
  }
};


allowedOrigins = ["http://localhost:3000"];
app.use(
  cors({
    origin: allowedOrigins,
  })
);

app.use(express.json());

app.get("/api/shipments", async (req, res) => {
  try {
    const shipments = await fetchShipments();
    res.json(shipments);
  } catch (error) {
    console.error("Error handling shipments request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
