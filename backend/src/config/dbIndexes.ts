/*
import mongoose from "mongoose";

/**
 * Create all production MongoDB indexes.
 * Called once after DB connection is established.
 * Indexes are idempotent — safe to run on every startup.
 * /
export async function createIndexes(): Promise<void> {
  try {
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database not connected.");

    // ── Complaints collection ─────────────────────────────────────
    const complaints = db.collection("complaints");

    await complaints.createIndex({ status: 1 });
    await complaints.createIndex({ department: 1 });
    await complaints.createIndex({ priority: 1 });
    await complaints.createIndex({ createdAt: -1 });
    await complaints.createIndex({ userId: 1, createdAt: -1 });
    await complaints.createIndex({ aiRiskLevel: 1 });

    // Compound: admin dashboard filters (status + department + date)
    await complaints.createIndex({ status: 1, department: 1, createdAt: -1 });

    // Full-text search on title + description
    await complaints.createIndex(
      { title: "text", description: "text" },
      { weights: { title: 3, description: 1 }, name: "complaint_text_search" }
    );

    // ── Users collection ──────────────────────────────────────────
    const users = db.collection("users");
    await users.createIndex({ email: 1 }, { unique: true });
    await users.createIndex({ role: 1 });

    // ── Sessions / tokens (if applicable) ────────────────────────
    // await db.collection("sessions").createIndex(
    //   { createdAt: 1 },
    //   { expireAfterSeconds: 7 * 24 * 60 * 60 } // 7-day TTL
    // );

    console.log("✅  MongoDB indexes created/verified.");
  } catch (err) {
    console.error("❌  Failed to create indexes:", err);
    // Non-fatal — app can still run without optimized indexes
  }
}
*/
