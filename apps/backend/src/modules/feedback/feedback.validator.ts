// ============================================================
// feedback.validator.ts — Validation Schemas for Feedback & Reviews
// ============================================================

import { z } from 'zod';
import { OverallRating } from '@interviewiq/shared';

export const createFeedbackSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  rawNotes: z.string().min(20, 'Notes must be at least 20 characters').max(3000),
  overallRating: z.nativeEnum(OverallRating),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  learningRecommendations: z.array(z.string()).default([]),
});

export const createReviewSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  rating: z.number().int().min(1, 'Rating must be between 1 and 5').max(5),
  comment: z.string().min(5, 'Comment must be at least 5 characters').max(1000),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
