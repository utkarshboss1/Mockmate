// ============================================================
// admin.controller.ts — Admin Express Controller
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service';
import { paginatedResponse, successResponse } from '../../types';

export class AdminController {
  async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analytics = await adminService.getAnalyticsOverview();
      res.json(successResponse(analytics));
    } catch (error) {
      next(error);
    }
  }

  async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { items, meta } = await adminService.listUsers(req.query as any);
      res.json(paginatedResponse(items, meta));
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await adminService.updateUserStatus(req.params.id, req.body.status);
      res.json(successResponse(user, 'User status updated successfully'));
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
