// path: server/src/routes/complaints.ts
// Complaint CRUD routes — all protected by JWT auth.

import { Router } from 'express';
import {
  createComplaint, getComplaint, listComplaints,
  updateStatus, deleteComplaint, getDraft,
} from '../controllers/complaintController';
import { authenticate, requireRole } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import { sanitizeBody } from '../middleware/requestLogger';

const router = Router();

// All complaint routes require authentication
router.use(authenticate, apiLimiter);

router.post('/',                    sanitizeBody, createComplaint);
router.get('/',                     listComplaints);
router.get('/:id',                  getComplaint);
router.get('/:id/draft',            getDraft);
router.patch('/:id/status',         requireRole('admin','lawyer'), sanitizeBody, updateStatus);
router.delete('/:id',               requireRole('admin'), deleteComplaint);

export default router;
