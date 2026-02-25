// path: server/src/middleware/errorHandler.ts
// Global Express error handler. Formats errors consistently.
// In production, never expose stack traces to clients.

import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  console.error(`[ERROR] ${statusCode} – ${err.message}`, isProduction ? '' : err.stack);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

// Helper to create operational errors with status codes
export const createError = (message: string, statusCode = 400): AppError => {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.isOperational = true;
  return err;
};
