// ============================================================
// prisma.ts — Prisma Client Singleton + Connection Probe
//
// The Prisma client is always instantiated so imports don't need
// to be conditional. Repository selection is controlled only by
// STORAGE_MODE in mockStore/mode; connection checks never switch
// the app to sample data.
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
 * Checks database availability during startup. Repositories use the
 * configured storage mode and do not fall back when this check fails later.
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
