// src/middleware/errorMiddleware.ts
// Centralised Express error handler.
// Every thrown error or next(err) call flows through here.
// In production, stack traces are hidden from clients.
// Usage: app.use(errorHandler)  ← must be LAST middleware registered

import { Request, Response, NextFunction } from 'express';

// ── Custom App Error ──────────────────────────────────────────────────────────

export interface AppError extends Error {
  statusCode?:    number;
  isOperational?: boolean;
}

// Factory function — creates a typed error without try/catch boilerplate
export function createError(message: string, statusCode = 400): AppError {
  const err: AppError    = new Error(message);
  err.statusCode         = statusCode;
  err.isOperational      = true;
  return err;
}

// ── Global Error Handler ──────────────────────────────────────────────────────
// Must have exactly 4 parameters for Express to treat it as an error handler

export function errorHandler(
  err:  AppError,
  req:  Request,
  res:  Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal Server Error';

  // ── Mongoose: Duplicate key (e.g. duplicate email) ────────────────────────
  if ((err as unknown as { code?: number }).code === 11000) {
    statusCode = 409;
    message    = 'A record with that value already exists';
  }

  // ── Mongoose: Validation error ────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message    = Object.values(
      (err as unknown as { errors: Record<string, { message: string }> }).errors
    )
      .map((e) => e.message)
      .join(', ');
  }

  // ── Mongoose: Bad ObjectId ─────────────────────────────────────────────────
  if (err.name === 'CastError') {
    statusCode = 400;
    message    = 'Invalid ID format';
  }

  // ── JWT errors ─────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError')  { statusCode = 401; message = 'Invalid token';  }
  if (err.name === 'TokenExpiredError')  { statusCode = 401; message = 'Token expired';  }

  // Log server errors (5xx)
  if (statusCode >= 500) {
    console.error(`[ERROR] ${req.method} ${req.path} → ${statusCode}: ${message}`);
    if (process.env.NODE_ENV !== 'production') console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Only show stack trace in development
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}
