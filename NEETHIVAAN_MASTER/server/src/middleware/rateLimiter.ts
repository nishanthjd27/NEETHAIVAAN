// path: server/src/middleware/rateLimiter.ts
// Different rate limits for different endpoint sensitivity levels.
// Auth:    10 req / 15 min  (brute-force protection)
// Chatbot: 10 req / 1 min   (cost control)
// API:     100 req / 15 min (general protection)

import rateLimit from 'express-rate-limit';
import { ENV }   from '../config/env';

const makeMessage = (wait: string) => ({
  success: false,
  message: `Too many requests. Please try again in ${wait}.`,
});

// Auth endpoints — strictest
export const authLimiter = rateLimit({
  windowMs:       15 * 60 * 1000,
  max:            ENV.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders:  false,
  message:        makeMessage('15 minutes'),
});

// Chatbot — per-minute limit
export const chatbotLimiter = rateLimit({
  windowMs:       60 * 1000,
  max:            ENV.CHATBOT_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders:  false,
  message:        makeMessage('1 minute'),
});

// General API
export const apiLimiter = rateLimit({
  windowMs:       ENV.RATE_LIMIT_WINDOW_MS,
  max:            ENV.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders:  false,
  message:        makeMessage('15 minutes'),
});
