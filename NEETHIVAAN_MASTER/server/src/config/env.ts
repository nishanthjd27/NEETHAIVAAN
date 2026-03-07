// path: server/src/config/env.ts
// Loads and validates all environment variables at startup.
// The app will NOT start if required variables are missing.

import dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`❌ Missing required environment variable: ${key}`);
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

export const ENV = {
  // Server
  PORT:         parseInt(optional('PORT', '5000'), 10),
  NODE_ENV:     optional('NODE_ENV', 'development'),
  IS_PROD:      process.env.NODE_ENV === 'production',

  // Database
  MONGODB_URI:  required('MONGODB_URI'),

  // JWT
  JWT_SECRET:          required('JWT_SECRET'),
  JWT_EXPIRES_IN:      optional('JWT_EXPIRES_IN', '7d'),

  // Bcrypt
  BCRYPT_SALT_ROUNDS:  parseInt(optional('BCRYPT_SALT_ROUNDS', '12'), 10),

  // CORS
  CORS_ORIGINS: optional('CORS_ORIGINS', 'http://localhost:5173').split(',').map(o => o.trim()),

  // Email
  EMAIL_USER: optional('EMAIL_USER', ''),
  EMAIL_PASS: optional('EMAIL_PASS', ''),
  EMAIL_FROM: optional('EMAIL_FROM', 'NEETHIVAAN Portal'),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: optional('CLOUDINARY_CLOUD_NAME', ''),
  CLOUDINARY_API_KEY:    optional('CLOUDINARY_API_KEY', ''),
  CLOUDINARY_API_SECRET: optional('CLOUDINARY_API_SECRET', ''),

  // Features
  AUTO_ESCALATE_DAYS:     parseInt(optional('AUTO_ESCALATE_DAYS', '5'), 10),
  CLIENT_URL:             optional('CLIENT_URL', 'http://localhost:5173'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS:   parseInt(optional('RATE_LIMIT_WINDOW_MS', '900000'), 10),
  RATE_LIMIT_MAX:         parseInt(optional('RATE_LIMIT_MAX', '100'), 10),
  AUTH_RATE_LIMIT_MAX:    parseInt(optional('AUTH_RATE_LIMIT_MAX', '10'), 10),
  CHATBOT_RATE_LIMIT_MAX: parseInt(optional('CHATBOT_RATE_LIMIT_MAX', '10'), 10),
} as const;
