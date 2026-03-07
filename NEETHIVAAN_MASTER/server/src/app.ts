// path: server/src/app.ts
// Express application factory — Phase 3 updated.
// New routes: /api/admin, /api/lawyer
// All existing Phase 1 & 2 routes untouched.

import express          from 'express';
import cors             from 'cors';
import helmet           from 'helmet';
import morgan           from 'morgan';
import { ENV }          from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter }   from './middleware/rateLimiter';

// ── Routes ────────────────────────────────────────────────────────────────────
import authRoutes       from './routes/auth';
import complaintRoutes  from './routes/complaints';
import publicRoutes     from './routes/public';
import adminRoutes      from './routes/adminRoutes';    // Phase 3
import lawyerRoutes     from './routes/lawyerRoutes';  // Phase 3

export function createApp(): express.Application {
  const app = express();

  // ── Security Headers ────────────────────────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy:     false,
    crossOriginEmbedderPolicy: false,
  }));

  // ── CORS ─────────────────────────────────────────────────────────────────────
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || ENV.CORS_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: Origin '${origin}' not allowed`));
    },
    credentials:    true,
    methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // ── Body Parsing ─────────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ── Logging ───────────────────────────────────────────────────────────────────
  app.use(morgan(ENV.IS_PROD ? 'combined' : 'dev'));

  // ── Global Rate Limit ─────────────────────────────────────────────────────────
  app.use('/api', apiLimiter);

  // ── Health Check ──────────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({
      status:    'ok',
      service:   'NEETHIVAAN API',
      version:   '3.0.0',
      phase:     'Phase 3 — Role-Based Access Control + Admin Workflow',
      timestamp: new Date().toISOString(),
      env:       ENV.NODE_ENV,
    });
  });

  // ── API Routes ────────────────────────────────────────────────────────────────
  // Phase 1 & 2 — unchanged
  app.use('/api/auth',       authRoutes);
  app.use('/api/complaints', complaintRoutes);
  app.use('/api/public',     publicRoutes);

  // Phase 3 — new
  app.use('/api/admin',      adminRoutes);
  app.use('/api/lawyer',     lawyerRoutes);

  // ── 404 Handler ───────────────────────────────────────────────────────────────
  app.use('*', (_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });

  // ── Global Error Handler — MUST be last ───────────────────────────────────────
  app.use(errorHandler);

  return app;
}
