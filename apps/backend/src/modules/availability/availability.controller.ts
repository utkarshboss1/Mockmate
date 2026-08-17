// ============================================================
// availability.controller.ts — Express Controller for Availability
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { availabilityService } from './availability.service';
import { successResponse } from '../../types';

export class AvailabilityController {
  async getMyWeeklySlots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slots = await availabilityService.getMyWeeklySlots(req.user!.id);
      res.json(successResponse(slots));
    } catch (error) {
      next(error);
    }
  }

  async updateMyWeeklySlots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slots = await availabilityService.updateMyWeeklySlots(req.user!.id, req.body);
      res.json(successResponse(slots, 'Weekly availability updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getInterviewerBookableSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const days = req.query.days ? Number(req.query.days) : 14;
      const result = await availabilityService.generateBookableSlots(req.params.id, days);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async getMyBlockedSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slots = await availabilityService.getMyBlockedSlots(req.user!.id);
      res.json(successResponse(slots));
    } catch (error) {
      next(error);
    }
  }

  async createMyBlockedSlot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const blockedSlot = await availabilityService.createMyBlockedSlot(req.user!.id, req.body);
      res.status(201).json(successResponse(blockedSlot, 'Time slot blocked successfully'));
    } catch (error) {
      next(error);
    }
  }

  async deleteMyBlockedSlot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await availabilityService.deleteMyBlockedSlot(req.user!.id, req.params.id);
      res.json(successResponse(null, 'Blocked time slot removed'));
    } catch (error) {
      next(error);
    }
  }
}

export const availabilityController = new AvailabilityController();
