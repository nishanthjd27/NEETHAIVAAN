// path: server/src/utils/trackingToken.ts
// Generates a secure random public tracking token.
// Used for the public complaint tracker (no auth required).
// Token is unguessable — 32 random bytes = 64 hex chars.

import crypto from 'crypto';

export function generateTrackingToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
