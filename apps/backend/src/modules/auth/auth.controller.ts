// ============================================================
// auth.controller.ts — Thin Express Controller for Auth
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { authService } from './auth.service';
import { successResponse } from '../../types';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const headers = fromNodeHeaders(req.headers);
      const result = await authService.register(req.body, headers);
      res.status(201).json(successResponse(result, 'Registration successful'));
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const headers = fromNodeHeaders(req.headers);
      const result = await authService.login(req.body, headers);
      res.json(successResponse(result, 'Login successful'));
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getCurrentUser(req.user!.id);
      res.json(successResponse(user));
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
