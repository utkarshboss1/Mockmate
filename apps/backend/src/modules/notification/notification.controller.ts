// ============================================================
// notification.controller.ts — Express Controller for Notifications
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { notificationService } from './notification.service';
import { successResponse } from '../../types';

export class NotificationController {
  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await notificationService.getUserNotifications(req.user!.id);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await notificationService.markAsRead(req.params.id, req.user!.id);
      res.json(successResponse(null, 'Notification marked as read'));
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await notificationService.markAllAsRead(req.user!.id);
      res.json(successResponse(null, 'All notifications marked as read'));
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
