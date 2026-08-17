// ============================================================
// feedback.controller.ts — Feedback & Review Controller
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { feedbackService } from './feedback.service';
import { successResponse } from '../../types';

export class FeedbackController {
  async submitFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const feedback = await feedbackService.submitFeedback(req.user!.id, req.body);
      res.status(201).json(successResponse(feedback, 'Feedback submitted successfully'));
    } catch (error) {
      next(error);
    }
  }

  async submitReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const review = await feedbackService.submitReview(req.user!.id, req.body);
      res.status(201).json(successResponse(review, 'Review published successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const feedback = await feedbackService.getFeedback(
        req.params.bookingId,
        req.user!.id,
        req.user!.role,
      );
      res.json(successResponse(feedback));
    } catch (error) {
      next(error);
    }
  }
}

export const feedbackController = new FeedbackController();
