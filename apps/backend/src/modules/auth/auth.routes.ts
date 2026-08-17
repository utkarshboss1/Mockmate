// ============================================================
// auth.routes.ts — Router for Auth endpoints
// ============================================================

import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { registerSchema, loginSchema } from './auth.validator';
import { authLimiter } from '../../middleware/rateLimiter';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), (req, res, next) =>
  authController.register(req, res, next),
);

router.post('/login', authLimiter, validate(loginSchema), (req, res, next) =>
  authController.login(req, res, next),
);

router.get('/me', requireAuth, (req, res, next) => authController.me(req, res, next));

export const authRouter = router;
