// ============================================================
// ai.validator.ts — AI Validation Schemas
// ============================================================

import { z } from 'zod';
import { InterviewType } from '@interviewiq/shared';

export const polishFeedbackSchema = z.object({
  rawNotes: z.string().min(15, 'Raw notes must be at least 15 characters').max(4000),
  interviewType: z.nativeEnum(InterviewType).default(InterviewType.TECHNICAL_CODING),
});

export const prepAdvisorSchema = z.object({
  targetRole: z.string().min(2, 'Target role is required').max(100),
  targetCompany: z.string().max(100).optional(),
});

export type PolishFeedbackInput = z.infer<typeof polishFeedbackSchema>;
export type PrepAdvisorInput = z.infer<typeof prepAdvisorSchema>;
