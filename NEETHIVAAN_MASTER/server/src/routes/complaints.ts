// path: server/src/routes/complaints.ts
// All complaint routes with role-based access control.
//
// Route Map:
// POST   /api/complaints/              → Create complaint          [user, lawyer, admin]
// GET    /api/complaints/              → Get all (role-filtered)   [all authenticated]
// GET    /api/complaints/stats         → Get stats                 [all authenticated]
// GET    /api/complaints/:id           → Get single complaint      [owner, lawyer, admin]
// PUT    /api/complaints/:id/status    → Update status             [admin, lawyer]
// PUT    /api/complaints/:id/stage     → Update case stage         [admin, lawyer]
// PUT    /api/complaints/:id/assign    → Assign lawyer             [admin only]
// POST   /api/complaints/:id/hearing   → Add hearing date          [admin, lawyer]
// POST   /api/complaints/:id/token     → Generate tracking token   [owner, admin]
// POST   /api/complaints/:id/resolution→ Add resolution summary    [admin, lawyer]
// GET    /api/public/track/:token      → Public tracking           [no auth]

import { Router }         from 'express';
import { authenticate }   from '../middleware/authenticate';
import { authorize }      from '../middleware/authorize';
import { sanitizeInput }  from '../middleware/sanitize';
import { apiLimiter }     from '../middleware/rateLimiter';
import {
  createComplaint,
  getAllComplaints,
  getComplaint,
  updateStatus,
  updateCaseStage,
  assignLawyer,
  addHearingDate,
  generatePublicToken,
  publicTrack,
  getStats,
  addResolutionSummary,
} from '../controllers/complaintController';

const router = Router();

// ── Apply auth + sanitization to all routes ──────────────────────────────────
router.use(authenticate);
router.use(sanitizeInput);
router.use(apiLimiter);

// ── Collection routes ─────────────────────────────────────────────────────────
router.get('/stats',  getStats);          // Must come before /:id
router.get('/',       getAllComplaints);
router.post('/',      createComplaint);

// ── Single complaint routes ───────────────────────────────────────────────────
router.get('/:id',    getComplaint);

// Admin + Lawyer only
router.put('/:id/status',
  authorize('admin', 'lawyer'),
  updateStatus
);

router.put('/:id/stage',
  authorize('admin', 'lawyer'),
  updateCaseStage
);

router.post('/:id/hearing',
  authorize('admin', 'lawyer'),
  addHearingDate
);

router.post('/:id/resolution',
  authorize('admin', 'lawyer'),
  addResolutionSummary
);

// Admin only
router.put('/:id/assign',
  authorize('admin'),
  assignLawyer
);

// Owner or admin
router.post('/:id/token',
  generatePublicToken
);

export default router;
