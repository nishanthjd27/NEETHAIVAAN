// path: server/src/models/User.ts
// Mongoose User schema. Passwords are stored as bcrypt hashes — never plaintext.

import { Schema, model, Document } from 'mongoose';

export type UserRole = 'user' | 'lawyer' | 'admin';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;        // bcrypt hash
  role: UserRole;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name:     { type: String, required: true, trim: true, maxlength: 100 },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role:     { type: String, enum: ['user', 'lawyer', 'admin'], default: 'user' },
    phone:    { type: String, trim: true },
  },
  { timestamps: true }
);

// Never return password field in JSON responses
UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

export const User = model<IUser>('User', UserSchema);
