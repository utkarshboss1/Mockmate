// ============================================================
// auth-client.ts — Better Auth Frontend Client
// ============================================================

import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000',
});

export const { useSession, signIn, signUp, signOut } = authClient;
