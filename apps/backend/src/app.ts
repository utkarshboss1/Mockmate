// ============================================================
// app.ts — Express Application Configuration
// ============================================================

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth';
import { env } from './config/env';
import { generalLimiter } from './middleware/rateLimiter';
import { errorMiddleware } from './middleware/error.middleware';
import { authRouter } from './modules/auth/auth.routes';
import { paymentsService } from './modules/payments/payments.service';
import { usersRouter } from './modules/users/users.routes';
import { marketplaceRouter } from './modules/marketplace/marketplace.routes';
import { availabilityRouter } from './modules/availability/availability.routes';
import { bookingRouter } from './modules/booking/booking.routes';
import { paymentsRouter } from './modules/payments/payments.routes';
import { interviewRouter } from './modules/interview/interview.routes';
import { feedbackRouter } from './modules/feedback/feedback.routes';
import { aiRouter } from './modules/ai/ai.routes';
import { notificationRouter } from './modules/notification/notification.routes';
import { adminRouter } from './modules/admin/admin.routes';

export function createApp() {
  const app = express();

  // Trust the first proxy (load balancer / reverse proxy) so req.ip
  // reflects real client IPs — required for correct rate limiting.
  app.set('trust proxy', 1);

  // ─── Security Middleware ─────────────────────────────────
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    }),
  );

  // ─── General Middleware ──────────────────────────────────
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
  app.use(generalLimiter);

  // ─── Better Auth Route Handler ───────────────────────────
  // CRITICAL: Mount before express.json() so raw body isn't consumed prematurely
  app.all('/api/auth/*', toNodeHandler(auth));

  // ─── Razorpay Webhook ──────────────────────────────────────
  // CRITICAL: Must be mounted BEFORE express.json() — the webhook signature
  // is an HMAC over the raw request body, which json parsing would destroy.
  app.post(
    '/api/v1/payments/webhook',
    express.raw({ type: 'application/json', limit: '1mb' }),
    async (req, res, next) => {
      try {
        const rawBody = req.body?.toString('utf8') ?? '';
        const signature = String(req.headers['x-razorpay-signature'] ?? '');
        const result = await paymentsService.handleRazorpayWebhook(rawBody, signature);
        res.json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  // ─── Body Parsing ────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ─── Health Check ────────────────────────────────────────
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
      },
    });
  });

  // ─── Application API Routes ───────────────────────────────
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/marketplace', marketplaceRouter);
  app.use('/api/v1/availability', availabilityRouter);
  app.use('/api/v1/bookings', bookingRouter);
  app.use('/api/v1/payments', paymentsRouter);
  app.use('/api/v1/interviews', interviewRouter);
  app.use('/api/v1/feedback', feedbackRouter);
  app.use('/api/v1/ai', aiRouter);
  app.use('/api/v1/notifications', notificationRouter);
  app.use('/api/v1/admin', adminRouter);

  // ─── 404 Handler ─────────────────────────────────────────
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested endpoint does not exist',
      },
    });
  });

  // ─── Global Error Handler ────────────────────────────────
  app.use(errorMiddleware);

  return app;
}
