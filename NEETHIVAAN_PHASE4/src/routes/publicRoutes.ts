import { Router } from "express";
import { trackComplaint } from "../controllers/publicController";

const router = Router();

/**
 * Public routes — no authentication middleware applied.
 *
 * Base path (mounted in app.ts): /api/public
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  GET  /api/public/track/:token                                          │
 * │                                                                         │
 * │  Citizen provides the raw 64-char tracking token they received when     │
 * │  their complaint was filed. The server hashes it and returns the        │
 * │  complaint status + history (citizen-safe projection only).             │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
router.get("/track/:token", trackComplaint);

export default router;
