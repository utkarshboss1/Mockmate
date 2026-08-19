// ============================================================
// payments.routes.ts — Router for Payments & Confirmations
// ============================================================

import { Router } from 'express';
import { paymentsController } from './payments.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate';
import { createCheckoutSessionSchema } from './payments.validator';

const router = Router();

// Protected routes requiring authentication
router.post(
  '/create-checkout-session',
  requireAuth,
  validate(createCheckoutSessionSchema),
  (req, res, next) => paymentsController.createCheckoutSession(req, res, next),
);

router.post(
  '/create-razorpay-order',
  requireAuth,
  (req, res, next) => paymentsController.createRazorpayOrder(req, res, next),
);

router.post(
  '/verify-razorpay-payment',
  requireAuth,
  (req, res, next) => paymentsController.verifyRazorpayPayment(req, res, next),
);

router.get('/booking/:bookingId', requireAuth, (req, res, next) =>
  paymentsController.getStatus(req, res, next),
);

export const paymentsRouter = router;
