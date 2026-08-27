// ============================================================
// prisma.ts — Prisma Client Singleton
// ============================================================

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

/**
 * Actively pings the database and refreshes the connection flag.
 * The flag must reflect reality — a transient startup failure should not
 * permanently pin the app in mock mode, and an outage later on should be
 * detected instead of serving stale "connected" state.
 */
export async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    setIsDbConnected(true);
    return true;
  } catch (_) {
    setIsDbConnected(false);
    return false;
  }
}
