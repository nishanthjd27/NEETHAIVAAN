// path: server/src/controllers/authController.ts
// Handles user registration, login (returns JWT), logout (blacklists token),
// and fetching the authenticated user's own profile.

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User';
import { TokenBlacklist } from '../models/TokenBlacklist';
import { AuditLog } from '../models/AuditLog';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// ── Zod Schemas ──────────────────────────────────────────────────────────────
const RegisterSchema = z.object({
  name:     z.string().min(2).max(100),
  email:    z.string().email(),
  password: z.string().min(6).max(100),
  role:     z.enum(['user', 'lawyer']).optional().default('user'),
  phone:    z.string().optional(),
});

const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function signToken(payload: { id: string; role: string; email: string }): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
}

// ── Register ──────────────────────────────────────────────────────────────────
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      next(createError(parsed.error.errors.map((e) => e.message).join(', ')));
      return;
    }
    const { name, email, password, role, phone } = parsed.data;

    const exists = await User.findOne({ email });
    if (exists) { next(createError('Email already registered', 409)); return; }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
    const hashedPwd = await bcrypt.hash(password, saltRounds);

    const user = await User.create({ name, email, password: hashedPwd, role, phone });
    const token = signToken({ id: user.id, role: user.role, email: user.email });

    res.status(201).json({ success: true, token, user });
  } catch (err) {
    next(err);
  }
};

// ── Login ────────────────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      next(createError(parsed.error.errors.map((e) => e.message).join(', ')));
      return;
    }
    const { email, password } = parsed.data;

    const user = await User.findOne({ email }).select('+password');
    if (!user) { next(createError('Invalid credentials', 401)); return; }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) { next(createError('Invalid credentials', 401)); return; }

    const token = signToken({ id: user.id, role: user.role, email: user.email });

    // Audit log
    await AuditLog.create({
      userId: user.id, action: 'login',
      entityType: 'User', entityId: user.id,
      ip: req.ip,
    });

    res.json({ success: true, token, user });
  } catch (err) {
    next(err);
  }
};

// ── Logout ────────────────────────────────────────────────────────────────────
export const logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) { res.json({ success: true, message: 'Logged out' }); return; }

    // Calculate token expiry to set TTL for blacklist document
    const decoded = jwt.decode(token) as { exp?: number } | null;
    const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 7 * 86400 * 1000);

    await TokenBlacklist.create({ token, expiresAt });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

// ── Get Profile ───────────────────────────────────────────────────────────────
export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) { next(createError('User not found', 404)); return; }
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
