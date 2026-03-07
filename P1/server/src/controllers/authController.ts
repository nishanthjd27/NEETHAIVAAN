// src/controllers/authController.ts
// Authentication operations: register, login, logout, getMe.
// Input validated with Zod before any DB operation.
// Passwords hashed with bcrypt — never stored or returned in plaintext.

import { Request, Response, NextFunction } from 'express';
import bcrypt                               from 'bcryptjs';
import jwt                                  from 'jsonwebtoken';
import { z }                                from 'zod';
import { User }                             from '../models/User';
import { AuthRequest, blacklistToken, extractToken } from '../middleware/authMiddleware';
import { createError }                      from '../middleware/errorMiddleware';

// ── Validation Schemas ────────────────────────────────────────────────────────

const RegisterSchema = z.object({
  name:     z.string()
    .min(2,   'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .trim(),
  email:    z.string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(6,   'Password must be at least 6 characters')
    .max(100, 'Password cannot exceed 100 characters'),
  role: z.enum(['user', 'lawyer'])
    .optional()
    .default('user'),
  phone: z.string().optional(),
});

const LoginSchema = z.object({
  email:    z.string().email('Please enter a valid email').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

// ── Helper: Sign JWT ──────────────────────────────────────────────────────────

function signToken(payload: { id: string; role: string; email: string }): string {
  const secret     = process.env.JWT_SECRET;
  const expiresIn  = process.env.JWT_EXPIRES_IN || '7d';

  if (!secret) throw new Error('JWT_SECRET is not configured');

  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

// ── Register ──────────────────────────────────────────────────────────────────

export async function register(
  req:  Request,
  res:  Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Validate input
    const result = RegisterSchema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.errors.map((e) => e.message).join(', ');
      return next(createError(message, 400));
    }

    const { name, email, password, role, phone } = result.data;

    // 2. Check duplicate email
    const existing = await User.findOne({ email });
    if (existing) {
      return next(createError('Email is already registered', 409));
    }

    // 3. Hash password
    const saltRounds    = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
    });

    // 5. Sign token
    const token = signToken({ id: user.id, role: user.role, email: user.email });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data:    { token, user },
    });
  } catch (err) {
    next(err);
  }
}

// ── Login ─────────────────────────────────────────────────────────────────────

export async function login(
  req:  Request,
  res:  Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Validate input
    const result = LoginSchema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.errors.map((e) => e.message).join(', ');
      return next(createError(message, 400));
    }

    const { email, password } = result.data;

    // 2. Find user — must explicitly select password (select: false on schema)
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.isActive) {
      // Return same message for both "not found" and "wrong password"
      // This prevents email enumeration attacks
      return next(createError('Invalid email or password', 401));
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(createError('Invalid email or password', 401));
    }

    // 4. Update last login timestamp
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // 5. Sign token
    const token = signToken({ id: user.id, role: user.role, email: user.email });

    // 6. Return user without password (toJSON transform strips it)
    const userResponse = user.toJSON();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data:    { token, user: userResponse },
    });
  } catch (err) {
    next(err);
  }
}

// ── Logout ────────────────────────────────────────────────────────────────────

export async function logout(
  req:  AuthRequest,
  res:  Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);

    if (token) {
      // Add token to blacklist so it cannot be reused
      // Phase 3 will persist this in MongoDB
      blacklistToken(token);
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
}

// ── Get Me ────────────────────────────────────────────────────────────────────

export async function getMe(
  req:  AuthRequest,
  res:  Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(createError('Not authenticated', 401));
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return next(createError('User not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Profile fetched',
      data:    { user },
    });
  } catch (err) {
    next(err);
  }
}
