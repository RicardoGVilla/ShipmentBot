const express = require("express");
const app = express();
const port = process.env.PORT || 4000;
const cors = require("cors");

allowedOrigins = ["http://localhost:3000"];
app.use(
  cors({
    origin: allowedOrigins,
  })
);

app.use(express.json());

app.get("/api/shipments", (req, res) => {
  res.json(shipments);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

