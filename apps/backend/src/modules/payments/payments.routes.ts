// ============================================================
// payments.routes.ts — Router for Payments & Confirmations
// ============================================================

import { Router } from 'express';
import { paymentsController } from './payments.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate';
import {
  createRazorpayOrderSchema,
  verifyRazorpayPaymentSchema,
} from './payments.validator';

const router = Router();

// Protected routes requiring authentication
router.post(
  '/create-razorpay-order',
  requireAuth,
  validate(createRazorpayOrderSchema),
  (req, res, next) => paymentsController.createRazorpayOrder(req, res, next),
);

router.post(
  '/verify-razorpay-payment',
  requireAuth,
  validate(verifyRazorpayPaymentSchema),
  (req, res, next) => paymentsController.verifyRazorpayPayment(req, res, next),
);

router.get('/booking/:bookingId', requireAuth, (req, res, next) =>
  paymentsController.getStatus(req, res, next),
);

export const paymentsRouter = router;
