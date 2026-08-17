// ============================================================
// admin.validator.ts — Admin Validation Schemas
// ============================================================

import { z } from 'zod';
import { UserStatus } from '@interviewiq/shared';

export const updateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

export const adminUserQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type AdminUserQueryInput = z.infer<typeof adminUserQuerySchema>;
