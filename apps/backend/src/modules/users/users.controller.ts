// ============================================================
// users.controller.ts — Thin Express Controller for Users & Profiles
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { successResponse } from '../../types';
import { errors } from '../../middleware/error.middleware';

export class UsersController {
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.getUserProfile(req.user!.id);
      res.json(successResponse(user));
    } catch (error) {
      next(error);
    }
  }

  async updateCandidateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.updateCandidateProfile(req.user!.id, req.body);
      res.json(successResponse(user, 'Profile updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async updateInterviewerProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await usersService.updateInterviewerProfile(req.user!.id, req.body);
      res.json(successResponse(profile, 'Interviewer profile updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw errors.badRequest('Please upload an image file');
      }
      const result = await usersService.uploadAvatar(req.user!.id, req.file.buffer);
      res.json(successResponse(result, 'Avatar uploaded successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getTags(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tags = await usersService.getTags();
      res.json(successResponse(tags));
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
