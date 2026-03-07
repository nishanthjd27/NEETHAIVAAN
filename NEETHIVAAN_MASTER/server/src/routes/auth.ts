// path: server/src/routes/auth.ts
// Authentication routes.
// Rate limited — prevents brute-force attacks on login/register.

import { Router }        from 'express';
import { register, login, logout, getMe } from '../controllers/authController';
import { authenticate }  from '../middleware/authenticate';
import { authLimiter }   from '../middleware/rateLimiter';
import { sanitizeInput } from '../middleware/sanitize';

const router = Router();

// Public routes (rate limited)
router.post('/register', authLimiter, sanitizeInput, register);
router.post('/login',    authLimiter, sanitizeInput, login);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/me',      authenticate, getMe);

export default router;
