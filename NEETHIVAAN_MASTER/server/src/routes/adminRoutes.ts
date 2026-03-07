// path: server/src/routes/adminRoutes.ts
// Phase 3 — Admin routes.
// Every route is double-protected:
//   authenticate → verifies JWT
//   requireRole('ADMIN') → rejects non-admin users
//
// Route map:
//   GET   /api/admin/stats                 → system stats dashboard
//   GET   /api/admin/complaints            → all complaints (filterable)
//   GET   /api/admin/users                 → all users (filterable)
//   GET   /api/admin/lawyers               → all lawyers (for assignment)
//   PATCH /api/admin/assign-lawyer/:id     → assign lawyer to complaint
//   PATCH /api/admin/update-stage/:id      → update case stage
//   PATCH /api/admin/update-status/:id     → update complaint status

import { Router }          from 'express';
import { authenticate }    from '../middleware/authenticate';
import { requireRole }     from '../middleware/authorize';
import { sanitizeInput }   from '../middleware/sanitize';
import { apiLimiter }      from '../middleware/rateLimiter';
import {
  getSystemStats,
  getAllComplaints,
  getAllUsers,
  getAllLawyers,
  assignLawyerToComplaint,
  updateComplaintStage,
  updateComplaintStatus,
} from '../controllers/adminController';

const router = Router();

// ── Apply to ALL admin routes ─────────────────────────────────────────────────
// authenticate  → must have valid JWT
// requireRole   → must be admin
// sanitizeInput → strip MongoDB injection attempts
// apiLimiter    → rate limiting
router.use(authenticate);
router.use(requireRole('ADMIN'));
router.use(sanitizeInput);
router.use(apiLimiter);

// ── Stats & Dashboard ─────────────────────────────────────────────────────────
router.get('/stats',      getSystemStats);

// ── Data Retrieval ────────────────────────────────────────────────────────────
router.get('/complaints', getAllComplaints);
router.get('/users',      getAllUsers);
router.get('/lawyers',    getAllLawyers);

// ── Complaint Mutations ───────────────────────────────────────────────────────
router.patch('/assign-lawyer/:id',  assignLawyerToComplaint);
router.patch('/update-stage/:id',   updateComplaintStage);
router.patch('/update-status/:id',  updateComplaintStatus);

export default router;
