// ============================================================
// payments.controller.ts — Payments Express Controller
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { paymentsService } from './payments.service';
import { successResponse } from '../../types';
import { errors } from '../../middleware/error.middleware';

export class PaymentsController {
  async createCheckoutSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await paymentsService.createCheckoutSession(req.user!.id, req.body.bookingId);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async createRazorpayOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await paymentsService.createRazorpayOrder(req.user!.id, req.body.bookingId);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async verifyRazorpayPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await paymentsService.verifyRazorpayPayment(req.user!.id, req.body);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = await paymentsService.getPaymentStatus(req.params.bookingId);
      res.json(successResponse(status));
    } catch (error) {
      next(error);
    }
  }
}

export const paymentsController = new PaymentsController();
