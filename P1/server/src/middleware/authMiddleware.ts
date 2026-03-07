// src/middleware/authMiddleware.ts
// Verifies the JWT Bearer token on every protected request.
// Attaches decoded user payload to req.user for downstream handlers.
// Usage: router.get('/protected', authenticate, handler)

import { Request, Response, NextFunction } from 'express';
import jwt                                  from 'jsonwebtoken';
import { createError }                      from './errorMiddleware';

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'lawyer' | 'admin';

export interface JwtPayload {
  id:    string;
  role:  UserRole;
  email: string;
  iat?:  number;
  exp?:  number;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// ── Token Blacklist (in-memory for Phase 1) ───────────────────────────────────
// Phase 3 will move this to MongoDB for persistence across restarts.
const tokenBlacklist = new Set<string>();

export function blacklistToken(token: string): void {
  tokenBlacklist.add(token);
}

// ── Authenticate Middleware ───────────────────────────────────────────────────

export function authenticate(
  req:  AuthRequest,
  res:  Response,
  next: NextFunction
): void {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(createError('No token provided. Please login.', 401));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(createError('Malformed authorization header', 401));
    }

    // 2. Check blacklist (logged-out tokens)
    if (tokenBlacklist.has(token)) {
      return next(createError('Token has been invalidated. Please login again.', 401));
    }

    // 3. Verify token signature and expiry
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return next(createError('JWT_SECRET not configured', 500));
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = decoded;

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(createError('Session expired. Please login again.', 401));
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return next(createError('Invalid token. Please login again.', 401));
    }
    next(err);
  }
}

// ── Extract token helper (for logout) ────────────────────────────────────────

export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return null;
}
