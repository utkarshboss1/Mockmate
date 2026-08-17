// ============================================================
// interview.controller.ts — Express Controller for Interviews
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { interviewService } from './interview.service';
import { successResponse } from '../../types';

export class InterviewController {
  async getToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await interviewService.getInterviewToken(
        req.params.id,
        req.user!.id,
        req.user!.name,
      );
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async getDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const interview = await interviewService.getInterviewDetails(req.params.id, req.user!.id);
      res.json(successResponse(interview));
    } catch (error) {
      next(error);
    }
  }

  async endSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const interview = await interviewService.endInterview(req.params.id, req.user!.id);
      res.json(successResponse(interview, 'Interview session concluded'));
    } catch (error) {
      next(error);
    }
  }
}

export const interviewController = new InterviewController();
