// path: server/src/routes/ai.ts
// AI/ML classification route — public (no auth required).

import { Router } from 'express';
import { classifyIntent } from '../controllers/aiController';
import { apiLimiter } from '../middleware/rateLimiter';
import { sanitizeBody } from '../middleware/requestLogger';

const router = Router();

router.post('/classify', apiLimiter, sanitizeBody, classifyIntent);

export default router;
