// path: server/src/routes/lawyerRoutes.ts
// Phase 3 — Lawyer routes.
// Every route is double-protected:
//   authenticate → verifies JWT
//   requireRole('LAWYER') → rejects non-lawyer users
//
// Route map:
//   GET   /api/lawyer/stats               → personal stats
//   GET   /api/lawyer/assigned            → all assigned complaints
//   GET   /api/lawyer/assigned/:id        → single assigned complaint detail
//   PATCH /api/lawyer/add-resolution/:id  → add resolution summary
//   PATCH /api/lawyer/update-stage/:id    → update case stage

import { Router }       from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole }  from '../middleware/authorize';
import { sanitizeInput } from '../middleware/sanitize';
import { apiLimiter }   from '../middleware/rateLimiter';
import {
  getLawyerStats,
  getAssignedComplaints,
  getAssignedComplaintDetail,
  addResolutionSummary,
  updateAssignedComplaintStage,
} from '../controllers/lawyerController';

const router = Router();

// ── Apply to ALL lawyer routes ────────────────────────────────────────────────
router.use(authenticate);
router.use(requireRole('LAWYER'));
router.use(sanitizeInput);
router.use(apiLimiter);

// ── Stats ─────────────────────────────────────────────────────────────────────
router.get('/stats',                getLawyerStats);

// ── Assigned Complaints ───────────────────────────────────────────────────────
router.get('/assigned',             getAssignedComplaints);
router.get('/assigned/:id',         getAssignedComplaintDetail);

// ── Mutations ─────────────────────────────────────────────────────────────────
router.patch('/add-resolution/:id', addResolutionSummary);
router.patch('/update-stage/:id',   updateAssignedComplaintStage);

export default router;
