// path: server/src/middleware/authorize.ts
// Phase 3 upgraded — supports both lowercase and uppercase role aliases.
// Usage:
//   requireRole('admin')    ← Phase 1/2 style
//   requireRole('ADMIN')    ← Phase 3 style
//   requireRole('ADMIN', 'LAWYER')  ← multiple roles
//   Also exported as: protect alias for authenticate (used in Phase 3 routes)

import { Response, NextFunction } from 'express';
import { AuthRequest, RoleAlias } from '../types';
import { createError }            from './errorHandler';

// Map Phase 3 uppercase aliases → DB lowercase values
const ROLE_MAP: Record<string, string> = {
  ADMIN:   'admin',
  LAWYER:  'lawyer',
  CITIZEN: 'user',
};

function normalizeRole(role: string): string {
  return ROLE_MAP[role.toUpperCase()] ?? role.toLowerCase();
}

// ── requireRole() ─────────────────────────────────────────────────────────────
// Accepts: 'admin', 'ADMIN', 'lawyer', 'LAWYER', 'user', 'CITIZEN'
export function requireRole(...allowedRoles: RoleAlias[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(createError('Not authenticated. Please login.', 401));
      return;
    }

    const userRole     = req.user.role.toLowerCase();
    const normalizedAllowed = allowedRoles.map(r => normalizeRole(r as string));

    if (!normalizedAllowed.includes(userRole)) {
      next(createError(
        `Access denied. Required: [${allowedRoles.join(', ')}]. Your role: ${req.user.role}`,
        403
      ));
      return;
    }

    next();
  };
}

// ── authorize() — Phase 2 backwards-compatible alias ─────────────────────────
export const authorize = requireRole;
