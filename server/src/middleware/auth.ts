// path: server/src/middleware/auth.ts
// Protects routes with JWT verification and optional role-based access control.

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { TokenBlacklist } from '../models/TokenBlacklist';
import { UserRole } from '../models/User';

// Extend Express Request to carry decoded user info
export interface AuthRequest extends Request {
  user?: { id: string; role: UserRole; email: string };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Check blacklist (logout tokens)
    const blacklisted = await TokenBlacklist.findOne({ token });
    if (blacklisted) {
      res.status(401).json({ success: false, message: 'Token has been invalidated' });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not configured');

    const decoded = jwt.verify(token, secret) as { id: string; role: UserRole; email: string };
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Factory: require one of the allowed roles
export const requireRole = (...roles: UserRole[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Access denied: insufficient role' });
      return;
    }
    next();
  };
