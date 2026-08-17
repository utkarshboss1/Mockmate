// ============================================================
// ai.routes.ts — Router for AI Services
// ============================================================

import { Router } from 'express';
import { aiController } from './ai.controller';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate';
import { aiLimiter } from '../../middleware/rateLimiter';
import { polishFeedbackSchema, prepAdvisorSchema } from './ai.validator';
import { UserRole } from '@interviewiq/shared';

const router = Router();

router.use(requireAuth, aiLimiter);

router.post(
  '/polish-feedback',
  requireRole(UserRole.INTERVIEWER, UserRole.ADMIN),
  validate(polishFeedbackSchema),
  (req, res, next) => aiController.polishFeedback(req, res, next),
);

router.post('/prep-advisor', validate(prepAdvisorSchema), (req, res, next) =>
  aiController.generatePrepAdvisor(req, res, next),
);

export const aiRouter = router;
