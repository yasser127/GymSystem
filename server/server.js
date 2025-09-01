// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import plansRoutes from "./routes/plansRoutes.js";

dotenv.config();

const app = express();

// Debugging/logging: (optional) log every request
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} → ${req.method} ${req.originalUrl}`);
  next();
});

// Body parsers (increase limits so images/form-data won't be rejected)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// CORS: set CORS_ORIGIN in .env to restrict in production
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  })
);

// Mount routes
app.use("/auth", authRoutes);
app.use("/plans", plansRoutes);

app.get("/_health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Centralized error handler (nice to catch unexpected errors)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
