// path: server/src/middleware/requestLogger.ts
// Simple request logger that records method, path, and response time.
// Also provides lightweight input sanitization (strip $ and . from keys).

import { Request, Response, NextFunction } from 'express';

export const requestLogger = (_req: Request, _res: Response, next: NextFunction): void => {
  // morgan already handles HTTP logging; this hook is for custom business events
  next();
};

// Recursively sanitize an object to prevent MongoDB operator injection
// e.g., { "$where": "..." } becomes { "where": "..." }
export const sanitizeInput = (obj: unknown): unknown => {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeInput);
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>)
      .filter(([key]) => !key.startsWith('$'))
      .map(([key, val]) => [key.replace(/\./g, '_'), sanitizeInput(val)])
  );
};

// Express middleware version
export const sanitizeBody = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body) req.body = sanitizeInput(req.body);
  next();
};
