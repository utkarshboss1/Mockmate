// ============================================================
// users.validator.ts — Profile Validation Schemas
// ============================================================

import { z } from 'zod';
import { ExperienceLevel } from '@interviewiq/shared';

export const updateCandidateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50).trim(),
  avatar: z.string().url('Invalid avatar URL').nullable().optional(),
});

export const updateInterviewerProfileSchema = z.object({
  headline: z
    .string()
    .min(5, 'Headline must be at least 5 characters')
    .max(160, 'Headline cannot exceed 160 characters')
    .trim(),
  bio: z
    .string()
    .min(20, 'Bio must be at least 20 characters')
    .max(3000, 'Bio cannot exceed 3000 characters')
    .trim(),
  company: z.string().max(100).nullable().optional(),
  jobTitle: z.string().max(100).nullable().optional(),
  yearsOfExperience: z.number().int().min(0, 'Years of experience cannot be negative').max(50),
  experienceLevel: z.nativeEnum(ExperienceLevel),
  pricePerHourRupees: z
    .number()
    .min(100, 'Minimum price is ₹100/hr')
    .max(50000, 'Maximum price is ₹50,000/hr'),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').nullable().optional().or(z.literal('')),
  githubUrl: z.string().url('Invalid GitHub URL').nullable().optional().or(z.literal('')),
  tags: z.array(z.string()).default([]),
});

export type UpdateCandidateProfileInput = z.infer<typeof updateCandidateProfileSchema>;
export type UpdateInterviewerProfileInput = z.infer<typeof updateInterviewerProfileSchema>;
