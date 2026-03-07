// src/routes/authRoutes.ts
// Authentication routes — all rate-limited to prevent brute-force attacks.
//
// Route map:
//   POST /api/auth/register  → Create new account   [public]
//   POST /api/auth/login     → Login, receive JWT   [public]
//   POST /api/auth/logout    → Invalidate token     [protected]
//   GET  /api/auth/me        → Get own profile      [protected]

import { Router }       from 'express';
import rateLimit        from 'express-rate-limit';
import { register, login, logout, getMe } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// ── Rate Limiter for auth endpoints ──────────────────────────────────────────
// Stricter than general API — prevents password brute-forcing
const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,                       // 15 minutes
  max:             parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10', 10),
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'Too many requests. Please try again in 15 minutes.',
  },
});

// ── Public Routes ─────────────────────────────────────────────────────────────
router.post('/register', authLimiter, register);
router.post('/login',    authLimiter, login);

// ── Protected Routes ──────────────────────────────────────────────────────────
router.post('/logout',   authenticate, logout);
router.get('/me',        authenticate, getMe);

export default router;
