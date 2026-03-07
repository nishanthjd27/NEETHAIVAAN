// path: server/src/middleware/errorHandler.ts
// Centralised Express error handler.
// In production, stack traces are hidden from clients.
// All errors flow through this — no scattered try/catch responses.

import { Request, Response, NextFunction } from 'express';
import { AppError }                         from '../types';
import { ENV }                              from '../config/env';

// ── Operational Error Factory ─────────────────────────────────────────────────
export function createError(message: string, statusCode = 400): AppError {
  const err: AppError = new Error(message);
  err.statusCode    = statusCode;
  err.isOperational = true;
  return err;
}

// ── Global Error Handler (must have 4 params for Express to recognise it) ─────
export function errorHandler(
  err:  AppError,
  req:  Request,
  res:  Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message    = err.message    || 'Internal Server Error';

  // Log every server error
  if (statusCode >= 500) {
    console.error(`[ERROR] ${req.method} ${req.path} → ${statusCode}: ${message}`);
    if (!ENV.IS_PROD) console.error(err.stack);
  }

  // Handle specific Mongoose errors
  if (err.name === 'ValidationError') {
    res.status(400).json({ success: false, message: 'Validation failed', error: message });
    return;
  }

  if (err.name === 'CastError') {
    res.status(400).json({ success: false, message: 'Invalid ID format' });
    return;
  }

  // Handle duplicate key (e.g., duplicate email)
  if ((err as unknown as { code?: number }).code === 11000) {
    res.status(409).json({ success: false, message: 'Duplicate value — resource already exists' });
    return;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(ENV.IS_PROD ? {} : { stack: err.stack }),
  });
}
