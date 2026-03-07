// path: server/src/middleware/sanitize.ts
// Strips MongoDB operator keys ($where, $gt etc.) from request bodies.
// Prevents NoSQL injection attacks.

import { Request, Response, NextFunction } from 'express';

function sanitize(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);

  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>)
      .filter(([key]) => !key.startsWith('$'))          // Remove $ operators
      .map(([key, val]) => [key.replace(/\./g, '_'), sanitize(val)]) // Flatten dots
  );
}

export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  if (req.body)   req.body   = sanitize(req.body);
  if (req.query)  req.query  = sanitize(req.query)  as typeof req.query;
  if (req.params) req.params = sanitize(req.params) as typeof req.params;
  next();
}
