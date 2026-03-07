// path: server/src/models/User.ts
// Core user model. Passwords stored as bcrypt hashes — NEVER plaintext.
// Avatar URL stored as Cloudinary URL.

import { Schema, model, Document } from 'mongoose';
import { UserRole }                 from '../types';

export interface IUser extends Document {
  name:          string;
  email:         string;
  password:      string;
  role:          UserRole;
  phone?:        string;
  avatar?:       string;        // Cloudinary URL
  isVerified:    boolean;
  isActive:      boolean;
  lastLogin?:    Date;
  createdAt:     Date;
  updatedAt:     Date;
}

const UserSchema = new Schema<IUser>(
  {
    name:       { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email:      { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password:   { type: String, required: true, minlength: 6, select: false },
    role:       { type: String, enum: ['user', 'lawyer', 'admin'], default: 'user' },
    phone:      { type: String, trim: true },
    avatar:     { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
    isActive:   { type: Boolean, default: true  },
    lastLogin:  { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;  // Never expose password
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const User = model<IUser>('User', UserSchema);
