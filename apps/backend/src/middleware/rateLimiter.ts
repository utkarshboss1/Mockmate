// ============================================================
// rateLimiter.ts — Rate Limiting Configurations
//
// WHY: Different routes need different rate limits.
// Auth routes need aggressive limiting to prevent brute force.
// General API routes need softer limits for normal usage.
// ============================================================

import rateLimit from 'express-rate-limit';
import { Request } from 'express';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
    },
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
    },
  },
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  // Key by authenticated user when available so users behind shared NATs
  // don't exhaust each other's quota; fall back to IP for anonymous calls.
  keyGenerator: (req: Request) => req.user?.id ?? req.ip ?? 'unknown',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'AI request limit reached. Please try again in an hour.',
    },
  },
});
