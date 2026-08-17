// ============================================================
// availability.validator.ts — Availability Validation Schemas
// ============================================================

import { z } from 'zod';
import { DayOfWeek } from '@interviewiq/shared';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const availabilitySlotInputSchema = z
  .object({
    dayOfWeek: z.nativeEnum(DayOfWeek),
    startTime: z.string().regex(timeRegex, 'Start time must be in HH:MM format'),
    endTime: z.string().regex(timeRegex, 'End time must be in HH:MM format'),
    isActive: z.boolean().default(true),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'Start time must be earlier than end time',
    path: ['endTime'],
  });

export const updateAvailabilitySchema = z.object({
  slots: z.array(availabilitySlotInputSchema),
});

export const getBookableSlotsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(30).default(14),
});

export const createBlockedSlotSchema = z
  .object({
    startDateTime: z.string().datetime('Start date/time must be a valid ISO string'),
    endDateTime: z.string().datetime('End date/time must be a valid ISO string'),
    reason: z.string().max(250).optional(),
  })
  .refine((data) => new Date(data.startDateTime) < new Date(data.endDateTime), {
    message: 'Start date/time must be earlier than end date/time',
    path: ['endDateTime'],
  });

export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
export type GetBookableSlotsQueryInput = z.infer<typeof getBookableSlotsQuerySchema>;
export type CreateBlockedSlotInput = z.infer<typeof createBlockedSlotSchema>;
