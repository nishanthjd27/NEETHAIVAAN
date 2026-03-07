// path: server/src/controllers/authController.ts
// Full authentication: register, login, logout, get-me.
// Uses Zod for input validation — rejects malformed data before DB hit.

import bcrypt         from 'bcryptjs';
import { z }          from 'zod';
import { User }       from '../models/User';
import { AuditLog }   from '../models/AuditLog';
import { TokenBlacklist } from '../models/TokenBlacklist';
import { AuthRequest }    from '../types';
import { asyncHandler }   from '../utils/asyncHandler';
import { signToken, getTokenExpiry } from '../utils/jwt';
import { successResponse, errorResponse } from '../utils/response';
import { createError }    from '../middleware/errorHandler';
import { ENV }            from '../config/env';
import { Request, Response, NextFunction } from 'express';

// ── Validation Schemas ────────────────────────────────────────────────────────
const RegisterSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters').max(100),
  email:    z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  role:     z.enum(['user', 'lawyer']).optional().default('user'),
  phone:    z.string().optional(),
});

const LoginSchema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

// ── Register ──────────────────────────────────────────────────────────────────
export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Validate input
  const result = RegisterSchema.safeParse(req.body);
  if (!result.success) {
    return next(createError(result.error.errors.map(e => e.message).join(', ')));
  }

  const { name, email, password, role, phone } = result.data;

  // Check duplicate
  const exists = await User.findOne({ email });
  if (exists) return next(createError('Email already registered', 409));

  // Hash password
  const hashedPassword = await bcrypt.hash(password, ENV.BCRYPT_SALT_ROUNDS);

  // Create user
  const user = await User.create({
    name, email, password: hashedPassword, role, phone,
  });

  // Sign token
  const token = signToken({ id: user.id, role: user.role, email: user.email });

  // Audit log
  await AuditLog.create({
    userId: user.id, action: 'register',
    entityType: 'User', entityId: user.id,
    ip: req.ip, userAgent: req.get('user-agent'),
  });

  return successResponse(res, { token, user }, 'Registration successful', 201);
});

// ── Login ─────────────────────────────────────────────────────────────────────
export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const result = LoginSchema.safeParse(req.body);
  if (!result.success) {
    return next(createError(result.error.errors.map(e => e.message).join(', ')));
  }

  const { email, password } = result.data;

  // Get user WITH password field (select: false by default)
  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.isActive) {
    return next(createError('Invalid email or password', 401));
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return next(createError('Invalid email or password', 401));

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Sign token
  const token = signToken({ id: user.id, role: user.role, email: user.email });

  // Audit log
  await AuditLog.create({
    userId: user.id, action: 'login',
    entityType: 'User', entityId: user.id,
    ip: req.ip, userAgent: req.get('user-agent'),
  });

  // Remove password from response object
  const userObj = user.toJSON();

  return successResponse(res, { token, user: userObj }, 'Login successful');
});

// ── Logout ────────────────────────────────────────────────────────────────────
export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (token) {
    const expiresAt = getTokenExpiry(token);
    // Add to blacklist — TTL index will auto-delete it after expiry
    await TokenBlacklist.create({ token, expiresAt }).catch(() => {
      // Ignore duplicate blacklist errors
    });
  }

  return successResponse(res, null, 'Logged out successfully');
});

// ── Get Me ────────────────────────────────────────────────────────────────────
export const getMe = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = await User.findById(req.user!.id);
  if (!user) return next(createError('User not found', 404));
  return successResponse(res, { user }, 'User profile fetched');
});
