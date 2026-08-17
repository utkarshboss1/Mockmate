// ============================================================
// prisma.ts — Prisma Client Singleton
// ============================================================

import '../config/env';
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  isDbConnected: boolean | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export function setIsDbConnected(status: boolean) {
  globalForPrisma.isDbConnected = status;
}

export function isDbConnected(): boolean {
  return globalForPrisma.isDbConnected ?? false;
}
