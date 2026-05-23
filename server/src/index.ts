import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger";

import analyzeRoutes from "./routes/analyze";
import settingsRoutes from "./routes/settings";
import notificationRoutes from "./routes/notifications";
import invoiceRoutes from "./routes/invoices";

const app = express();
const PORT = process.env.PORT ?? 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const MONGO_URI =
  process.env.MONGO_URI ?? "mongodb://localhost:27017/profit-lens";

if (!process.env.GEMINI_API_KEY) {
  console.error(
    "⚠️  WARNING: GEMINI_API_KEY is not defined in environment variables!",
  );
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err: unknown) =>
    console.error("❌ MongoDB connection error:", err),
  );

// Routes
app.get("/", (_req, res) => {
  res.send("Profit Lens API is running...");
});

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/analyze", analyzeRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/invoices", invoiceRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
