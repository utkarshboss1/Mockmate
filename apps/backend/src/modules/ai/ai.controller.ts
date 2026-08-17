// ============================================================
// ai.controller.ts — AI Express Controller
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { aiService } from './ai.service';
import { successResponse } from '../../types';

export class AIController {
  async polishFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await aiService.polishFeedback(req.body);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async generatePrepAdvisor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await aiService.generatePrepAdvisor(req.user!.id, req.body);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }
}

export const aiController = new AIController();
