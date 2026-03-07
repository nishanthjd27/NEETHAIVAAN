import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Central error handler – must be registered LAST in app.ts / server.ts
 * app.use(errorHandler);
 */
export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode ?? 500;
  const isProduction = process.env.NODE_ENV === "production";

  // Log full stack only in dev
  if (!isProduction) {
    console.error("❌ [Error]", err.stack);
  } else {
    console.error(`❌ [Error] ${statusCode} – ${err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    message: err.isOperational ? err.message : "An unexpected error occurred.",
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

/**
 * Factory helper — throw operational errors with a status code.
 * throw createError(404, "Complaint not found.");
 */
export function createError(statusCode: number, message: string): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.isOperational = true;
  return err;
}

/**
 * Catch-all for unmatched routes.
 * Register BEFORE errorHandler:  app.use(notFound);
 */
export const notFound = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const err: AppError = new Error(`Route not found: ${req.originalUrl}`);
  err.statusCode = 404;
  err.isOperational = true;
  next(err);
};
