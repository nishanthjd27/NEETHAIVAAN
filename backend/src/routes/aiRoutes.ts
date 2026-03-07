/*
import { Router } from "express";
import { analyzeCase } from "../controllers/aiController";
import { protect } from "../middleware/authMiddleware";   // your existing JWT middleware
import { adminOnly } from "../middleware/roleMiddleware"; // your existing role middleware

const router = Router();

// POST /api/ai/analyze/:complaintId
// Requires valid JWT + admin role
router.post("/analyze/:complaintId", protect, adminOnly, analyzeCase);

export default router;

// ── Register in app.ts / server.ts ──────────────────────────────────
// import aiRoutes from "./routes/aiRoutes";
// app.use("/api/ai", aiRoutes);
// ────────────────────────────────────────────────────────────────────
*/
