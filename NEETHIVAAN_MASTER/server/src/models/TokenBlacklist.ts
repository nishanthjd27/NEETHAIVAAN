// path: server/src/models/TokenBlacklist.ts
// Invalidated JWTs stored here after logout.
// TTL index auto-deletes expired tokens — zero manual cleanup needed.

import { Schema, model, Document } from 'mongoose';

export interface ITokenBlacklist extends Document {
  token:     string;
  expiresAt: Date;
}

const TokenBlacklistSchema = new Schema<ITokenBlacklist>({
  token:     { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date,   required: true, index: { expires: 0 } }, // MongoDB TTL index
});

export const TokenBlacklist = model<ITokenBlacklist>('TokenBlacklist', TokenBlacklistSchema);
