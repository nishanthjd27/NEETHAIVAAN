// path: server/src/routes/auth.ts
// Authentication routes: register, login, logout, profile.

import { Router } from 'express';
import { register, login, logout, getProfile } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { sanitizeBody } from '../middleware/requestLogger';

const router = Router();

router.post('/register', authLimiter, sanitizeBody, register);
router.post('/login',    authLimiter, sanitizeBody, login);
router.post('/logout',   authenticate, logout);
router.get('/me',        authenticate, getProfile);

export default router;
