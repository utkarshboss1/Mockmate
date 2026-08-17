// ============================================================
// types/index.ts — Backend-specific Extended Types
//
// WHY: Augments Express's Request type to include the
// authenticated user so TypeScript knows req.user is safe
// to access in controllers after auth middleware runs.
// ============================================================

import { UserRole, UserStatus } from '@interviewiq/shared';

// The authenticated user attached to req by auth middleware
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
}

// Augment Express Request globally
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// Pagination query params
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

// Standardized pagination metadata
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Helper to build pagination meta
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

// Helper to build paginated API success response
export function paginatedResponse<T>(
  data: T[],
  meta: PaginationMeta,
  message?: string,
) {
  return {
    success: true as const,
    data,
    message,
    meta,
  };
}

// Helper to build standard API success response
export function successResponse<T>(data: T, message?: string) {
  return {
    success: true as const,
    data,
    message,
  };
}
