// ============================================================
// auth.ts — Better Auth Core Instance
//
// WHY: Wraps Better Auth behind our own configuration.
// Uses Prisma adapter for persistent session storage in PostgreSQL.
// ============================================================

import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma';
import { env } from '../config/env';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,     // Update session in DB once per day
  },
  trustedOrigins: [env.FRONTEND_URL],
});
