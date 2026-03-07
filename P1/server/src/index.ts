// src/index.ts
// Server entry point.
// Connects to MongoDB first, then starts the HTTP server.
// Kept minimal — all app logic lives in app.ts.

import dotenv       from "dotenv";
dotenv.config();                        // Load .env before anything else

import { createApp } from "./app";
import { connectDB } from "./config/db";

const PORT = parseInt(process.env.PORT || "5000", 10);

async function bootstrap(): Promise<void> {
  try {
    // 1. Connect to MongoDB (will retry up to 5 times)
    await connectDB();

    // 2. Create Express app with all middleware + routes
    const app = createApp();

    // 3. Start HTTP server
    const server = app.listen(PORT, () => {
      console.log("");
      console.log("==========================================");
      console.log("  NEETHIVAAN – Legal Grievance System");
      console.log("  Server : http://localhost:" + PORT);
      console.log("  Health : http://localhost:" + PORT + "/health");
      console.log("  Env    : " + (process.env.NODE_ENV || "development"));
      console.log("==========================================");
      console.log("");
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason: unknown) => {
      console.error("Unhandled Rejection:", reason);
      server.close(() => process.exit(1));
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (err: Error) => {
      console.error("Uncaught Exception:", err.message);
      process.exit(1);
    });

  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

bootstrap();
