// path: server/src/routes/admin.ts
// Admin-only routes: analytics aggregations and audit logs.

import { Router } from 'express';
import {
  getStatusCounts, getMonthlyTrends,
  getAvgResolutionTime, getAuditLogs,
} from '../controllers/analyticsController';
import { authenticate, requireRole } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();

// Require admin role on all /api/admin routes
router.use(authenticate, requireRole('admin'), apiLimiter);

router.get('/analytics/status-counts',      getStatusCounts);
router.get('/analytics/monthly-trends',     getMonthlyTrends);
router.get('/analytics/avg-resolution-time', getAvgResolutionTime);
router.get('/audit-logs',                   getAuditLogs);

export default router;
