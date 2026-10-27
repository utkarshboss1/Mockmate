// ============================================================
// prisma.ts — Prisma Client Singleton + Connection Probe
//
// Prisma is the only persistence adapter used by the backend.
// ============================================================

import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Checks PostgreSQL availability during startup. The API does not start
 * without a working database connection.
 */
export async function checkDbConnection(maxRetries = 3): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }
      return false;
    }
  }
  return false;
}
