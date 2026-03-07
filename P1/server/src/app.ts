// src/app.ts
// Express application factory.
// Separated from index.ts so the app can be imported in unit tests
// without starting the HTTP server.
//
// Middleware order matters:
//   1. Security (helmet, cors)
//   2. Body parsing
//   3. Logging
//   4. Rate limiting
//   5. Routes
//   6. 404 handler
//   7. Global error handler  ← MUST be last

import express, { Application, Request, Response } from 'express';
import cors                                          from 'cors';
import helmet                                        from 'helmet';
import morgan                                        from 'morgan';
import rateLimit                                     from 'express-rate-limit';

import authRoutes                                    from './routes/authRoutes';
import { errorHandler }                              from './middleware/errorMiddleware';

export function createApp(): Application {
  const app = express();

  // ── 1. Security Headers (Helmet) ────────────────────────────────────────────
  // Sets X-Content-Type-Options, X-Frame-Options, HSTS, etc.
  app.use(helmet({
    contentSecurityPolicy:     false,   // Disabled — frontend handles its own CSP
    crossOriginEmbedderPolicy: false,   // Required for Cloudinary image loading
  }));

  // ── 2. CORS ──────────────────────────────────────────────────────────────────
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile apps, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: Origin '${origin}' is not allowed`));
    },
    credentials:    true,
    methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // ── 3. Body Parsing ──────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ── 4. HTTP Request Logging ──────────────────────────────────────────────────
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // ── 5. Global Rate Limiter ───────────────────────────────────────────────────
  const globalLimiter = rateLimit({
    windowMs:        parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max:             parseInt(process.env.RATE_LIMIT_MAX       || '100',    10),
    standardHeaders: true,
    legacyHeaders:   false,
    message: {
      success: false,
      message: 'Too many requests from this IP. Please try again later.',
    },
  });
  app.use('/api', globalLimiter);

  // ── 6. Health Check ──────────────────────────────────────────────────────────
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status:    'ok',
      service:   'NEETHIVAAN API',
      version:   '3.0.0',
      phase:     'Phase 1 — Backend Core Foundation',
      timestamp: new Date().toISOString(),
      env:       process.env.NODE_ENV || 'development',
    });
  });

  // ── 7. API Routes ─────────────────────────────────────────────────────────────
  app.use('/api/auth', authRoutes);

  // ── 8. 404 Handler ────────────────────────────────────────────────────────────
  app.use('*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `Route '${req.originalUrl}' not found`,
    });
  });

  // ── 9. Global Error Handler ── MUST be last ───────────────────────────────────
  app.use(errorHandler);

  return app;
}
