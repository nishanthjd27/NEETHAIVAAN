// path: server/src/utils/jwt.ts
// Centralised JWT operations. All token creation passes through here.

import jwt         from 'jsonwebtoken';
import { ENV }     from '../config/env';
import { JwtPayload } from '../types';

export function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}

// Get expiry date from token for TTL blacklist
export function getTokenExpiry(token: string): Date {
  const decoded = decodeToken(token);
  if (decoded?.exp) return new Date(decoded.exp * 1000);
  // Default 7 days if can't decode
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}
