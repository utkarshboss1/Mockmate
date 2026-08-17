// ============================================================
// reviews.routes.ts — Reviews Router
// ============================================================

import { Router } from 'express';
import { reviewsController } from './reviews.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate';
import { createReviewSchema } from './reviews.validator';

const router = Router();

router.use(requireAuth);

router.post('/', validate(createReviewSchema), (req, res, next) =>
  reviewsController.createReview(req, res, next),
);

export const reviewsRouter = router;
