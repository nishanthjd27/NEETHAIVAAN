// src/models/User.ts
// Core User model.
// Passwords are NEVER stored in plaintext — bcrypt hash only.
// The password field has select: false so it is excluded
// from every query unless explicitly requested with .select('+password').

import { Schema, model, Document } from 'mongoose';

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'lawyer' | 'admin';

export interface IUser extends Document {
  name:       string;
  email:      string;
  password:   string;        // bcrypt hash
  role:       UserRole;
  phone?:     string;
  avatar?:    string;        // Cloudinary URL (Phase 4)
  isVerified: boolean;
  isActive:   boolean;
  lastLogin?: Date;
  createdAt:  Date;
  updatedAt:  Date;
}

// ── Schema ────────────────────────────────────────────────────────────────────

const UserSchema = new Schema<IUser>(
  {
    name: {
      type:      String,
      required:  [true, 'Name is required'],
      trim:      true,
      minlength: [2,   'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      index:     true,
      match:     [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [6,   'Password must be at least 6 characters'],
      select:    false,   // Never returned in queries by default
    },
    role: {
      type:    String,
      enum:    ['user', 'lawyer', 'admin'],
      default: 'user',
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type:    String,
      default: '',
    },
    isVerified: {
      type:    Boolean,
      default: false,
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      // Strip password and __v from every JSON response automatically
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const User = model<IUser>('User', UserSchema);
