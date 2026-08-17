// ============================================================
// reviews.controller.ts — Reviews Express Controller
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { reviewsService } from './reviews.service';
import { successResponse } from '../../types';

export class ReviewsController {
  async createReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const review = await reviewsService.createReview(req.user!.id, req.body);
      res.status(201).json(successResponse(review));
    } catch (error) {
      next(error);
    }
  }
}

export const reviewsController = new ReviewsController();
