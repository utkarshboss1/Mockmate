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

export const polishedFeedbackOutputSchema = z.object({
  professionalSummary: z.string().min(1),
  strengths: z.array(z.string().min(1)),
  weaknesses: z.array(z.string().min(1)),
  learningRecommendations: z.array(z.string().min(1)),
});

export const prepAdvisorOutputSchema = z.object({
  targetRole: z.string().min(1),
  weeklyPlan: z.array(
    z.object({
      week: z.number().int().min(1).max(4),
      focus: z.string().min(1),
      tasks: z.array(z.string().min(1)),
    }),
  ).length(4),
  topStrategyTips: z.array(z.string().min(1)),
});

export type PolishFeedbackInput = z.infer<typeof polishFeedbackSchema>;
export type PrepAdvisorInput = z.infer<typeof prepAdvisorSchema>;
