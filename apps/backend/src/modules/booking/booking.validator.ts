// ============================================================
// booking.validator.ts — Booking Validation Schemas
// ============================================================

import { z } from 'zod';
import { InterviewType, BookingStatus } from '@interviewiq/shared';

export const createBookingSchema = z.object({
  interviewerProfileId: z.string().min(1, 'Interviewer profile ID is required'),
  scheduledAt: z
    .string()
    .datetime('Scheduled date must be a valid ISO 8601 date string')
    .refine((dateStr) => new Date(dateStr).getTime() > Date.now(), {
      message: 'Scheduled date must be in the future',
    }),
  interviewType: z.nativeEnum(InterviewType),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
});

export const cancelBookingSchema = z.object({
  reason: z
    .string()
    .min(5, 'Cancellation reason must be at least 5 characters')
    .max(500, 'Reason cannot exceed 500 characters'),
});

export const getBookingsQuerySchema = z.object({
  status: z.nativeEnum(BookingStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type GetBookingsQueryInput = z.infer<typeof getBookingsQuerySchema>;
