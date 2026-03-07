// path: server/src/middleware/rateLimiter.ts
// Separate rate limiters for auth endpoints vs general API.
// Stricter on auth to prevent brute-force attacks.

import rateLimit from 'express-rate-limit';

// Auth endpoints: 10 requests / 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
});

// General API: 200 requests / 15 minutes per IP
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Rate limit exceeded. Please slow down.' },
});
