// path: server/src/models/TokenBlacklist.ts
// Stores invalidated JWTs so logout is honoured until token expiry.
// A TTL index auto-purges expired tokens — no manual cleanup needed.

import { Schema, model, Document } from 'mongoose';

export interface ITokenBlacklist extends Document {
  token: string;
  expiresAt: Date;
}

const TokenBlacklistSchema = new Schema<ITokenBlacklist>({
  token:     { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL index
});

export const TokenBlacklist = model<ITokenBlacklist>('TokenBlacklist', TokenBlacklistSchema);
