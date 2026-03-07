/*
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import mongoSanitize from "express-mongo-sanitize";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";

import { validateEnv } from "./middleware/validateEnv";
import { corsOptions } from "./config/corsConfig";
import { createIndexes } from "./config/dbIndexes";
import { errorHandler, notFound } from "./middleware/errorHandler";

// ── Import all existing route files ──────────────────────────────
import authRoutes from "./routes/authRoutes";
import complaintRoutes from "./routes/complaintRoutes";
import userRoutes from "./routes/userRoutes";
import aiRoutes from "./routes/aiRoutes"; // Phase 6

// ── 1. Validate environment at startup ───────────────────────────
validateEnv();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// ── 2. Security headers ───────────────────────────────────────────
app.use(helmet());

// ── 3. Production CORS ────────────────────────────────────────────
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // pre-flight

// ── 4. Compression (gzip) ─────────────────────────────────────────
app.use(compression());

// ── 5. Body parsing ───────────────────────────────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ── 6. Sanitize MongoDB operators from req.body / query / params ──
app.use(mongoSanitize());

// ── 7. Global rate limiter ────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});
app.use("/api", globalLimiter);

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many login attempts. Try again in 15 minutes." },
});
app.use("/api/auth", authLimiter);

// ── 8. Health check ───────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    env: process.env.NODE_ENV,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ── 9. API Routes ─────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ai", aiRoutes);

// ── 10. 404 + Global error handler ───────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── 11. Database connection + server start ────────────────────────
async function startServer(): Promise<void> {
  try {
    await mongoose.connect(process.env.MONGO_URI!, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("✅  MongoDB connected.");

    await createIndexes();

    const server = app.listen(PORT, () => {
      console.log(
        `🚀  Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
      );
    });

    // ── Graceful shutdown ─────────────────────────────────────────
    const shutdown = async (signal: string) => {
      console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await mongoose.connection.close();
        console.log("🔌  MongoDB connection closed.");
        process.exit(0);
      });
      // Force close after 10 s
      setTimeout(() => process.exit(1), 10_000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    // Unhandled promise rejections
    process.on("unhandledRejection", (reason) => {
      console.error("❌  Unhandled Rejection:", reason);
      server.close(() => process.exit(1));
    });
  } catch (err) {
    console.error("❌  Failed to start server:", err);
    process.exit(1);
  }
}

startServer();

export default app;
*/
