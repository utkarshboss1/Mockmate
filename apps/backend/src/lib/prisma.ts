// ============================================================
// prisma.ts — Prisma Client Singleton + Connection Probe
//
// The Prisma client is always instantiated so that imports
// don't need to be conditional. Whether requests actually use
// it is decided by `isMockStorage()` in the mockStore layer
// and by `checkDbConnection()` here.
//
// If the connection check fails at boot, the app keeps running
// in memory mode (intentional dev behaviour for the college-LAN
// setup). In production, the env validator rejects STORAGE_MODE=
// "memory" before this file is ever loaded.
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
export async function checkDbConnection(maxRetries = 3): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      setIsDbConnected(true);
      return true;
    } catch (err) {
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }
      setIsDbConnected(false);
      return false;
    }
  }
  setIsDbConnected(false);
  return false;
}
