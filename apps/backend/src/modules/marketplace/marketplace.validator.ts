// ============================================================
// marketplace.validator.ts — Query Validation Schemas
// ============================================================

import { z } from 'zod';
import { ExperienceLevel } from '@interviewiq/shared';

export const marketplaceQuerySchema = z.object({
  search: z.string().optional(),
  experienceLevel: z.nativeEnum(ExperienceLevel).optional(),
  tags: z.string().optional(), // Comma-separated tag slugs
  minPriceRupees: z.coerce.number().optional(),
  maxPriceRupees: z.coerce.number().optional(),
  sort: z
    .enum(['rating_desc', 'price_asc', 'price_desc', 'experience_desc'])
    .default('rating_desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  // Marketplace only lists verified interviewers by default. Used by the
  // interviewer's own dashboard/profile preview to see their unverified page.
  includeUnverified: z.coerce.boolean().default(false),
});

export type MarketplaceQueryInput = z.infer<typeof marketplaceQuerySchema>;
