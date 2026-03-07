require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/profit-lens";

if (!process.env.GEMINI_API_KEY) {
  console.error("⚠️  WARNING: GEMINI_API_KEY is not defined in environment variables!");
}

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Routes
app.get("/", (req, res) => {
  res.send("Profit Lens API is running...");
});

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/analyze", require("./routes/analyze"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/invoices", require("./routes/invoices"));

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});