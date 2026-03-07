// src/middleware/roleMiddleware.ts
// Role-based access control guard.
// Must be used AFTER authenticate() middleware.
//
// Usage:
//   router.delete('/:id', authenticate, requireRole('admin'), handler)
//   router.put('/status',  authenticate, requireRole('admin', 'lawyer'), handler)

import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole }  from './authMiddleware';
import { createError }            from './errorMiddleware';

// Factory — call with the allowed roles, get back the Express middleware
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {

    // Ensure authenticate() ran before this middleware
    if (!req.user) {
      next(createError('Not authenticated. Please login.', 401));
      return;
    }

    // Check role permission
    if (!allowedRoles.includes(req.user.role)) {
      next(
        createError(
          `Access denied. Required: [${allowedRoles.join(', ')}]. Your role: ${req.user.role}`,
          403
        )
      );
      return;
    }

    next();
  };
}
