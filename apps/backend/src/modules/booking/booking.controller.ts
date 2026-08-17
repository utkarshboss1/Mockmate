// ============================================================
// booking.controller.ts — Express Controller for Bookings
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { bookingService } from './booking.service';
import { paginatedResponse, successResponse } from '../../types';

export class BookingController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const booking = await bookingService.createBooking(req.user!.id, req.body);
      res.status(201).json(successResponse(booking, 'Booking created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getCandidateBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { items, meta } = await bookingService.getCandidateBookings(req.user!.id, req.query as any);
      res.json(paginatedResponse(items, meta));
    } catch (error) {
      next(error);
    }
  }

  async getInterviewerBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { items, meta } = await bookingService.getInterviewerBookings(req.user!.id, req.query as any);
      res.json(paginatedResponse(items, meta));
    } catch (error) {
      next(error);
    }
  }

  async getDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const booking = await bookingService.getBookingDetails(req.params.id, req.user!.id, req.user!.role);
      res.json(successResponse(booking));
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const booking = await bookingService.cancelBooking(
        req.params.id,
        req.user!.id,
        req.user!.role,
        req.body.reason,
      );
      res.json(successResponse(booking, 'Booking cancelled successfully'));
    } catch (error) {
      next(error);
    }
  }
}

export const bookingController = new BookingController();
