// path: server/src/middleware/authenticate.ts
// Verifies JWT on every protected request.
// Checks token blacklist (logout). Attaches decoded user to req.user.

import { Response, NextFunction } from 'express';
import jwt                         from 'jsonwebtoken';
import { AuthRequest, JwtPayload } from '../types';
import { TokenBlacklist }          from '../models/TokenBlacklist';
import { createError }             from './errorHandler';
import { ENV }                     from '../config/env';

export async function authenticate(
  req:  AuthRequest,
  res:  Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Extract token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(createError('No token provided. Please login.', 401));
    }

    const token = authHeader.split(' ')[1];
    if (!token) return next(createError('Malformed authorization header', 401));

    // 2. Check blacklist (logged-out tokens)
    const isBlacklisted = await TokenBlacklist.findOne({ token });
    if (isBlacklisted) return next(createError('Token has been invalidated. Please login again.', 401));

    // 3. Verify token
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
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
