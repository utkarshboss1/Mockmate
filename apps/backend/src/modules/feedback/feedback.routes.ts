// ============================================================
// feedback.routes.ts — Router for Feedback & Reviews
// ============================================================

import { Router } from 'express';
import { feedbackController } from './feedback.controller';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate';
import { createFeedbackSchema, createReviewSchema } from './feedback.validator';
import { UserRole } from '@interviewiq/shared';

const router = Router();

router.use(requireAuth);

router.post(
  '/',
  requireRole(UserRole.INTERVIEWER, UserRole.ADMIN),
  validate(createFeedbackSchema),
  (req, res, next) => feedbackController.submitFeedback(req, res, next),
);

router.post('/reviews', validate(createReviewSchema), (req, res, next) =>
  feedbackController.submitReview(req, res, next),
);

router.get('/booking/:bookingId', (req, res, next) =>
  feedbackController.getFeedback(req, res, next),
);

export const feedbackRouter = router;
