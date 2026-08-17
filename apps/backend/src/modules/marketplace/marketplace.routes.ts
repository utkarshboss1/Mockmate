// ============================================================
// marketplace.routes.ts — Router for Public Marketplace
// ============================================================

import { Router } from 'express';
import { marketplaceController } from './marketplace.controller';
import { validate } from '../../middleware/validate';
import { marketplaceQuerySchema } from './marketplace.validator';

const router = Router();

// Public routes — no auth required to browse marketplace
router.get('/interviewers', validate(marketplaceQuerySchema, 'query'), (req, res, next) =>
  marketplaceController.search(req, res, next),
);

router.get('/interviewers/:id', (req, res, next) =>
  marketplaceController.getDetails(req, res, next),
);

export const marketplaceRouter = router;
