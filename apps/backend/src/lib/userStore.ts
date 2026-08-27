// ============================================================
// userStore.ts — Shared In-Memory User & Session Registry
// Ensures genuine users persist their actual name, email & role
// ============================================================

import { UserRole, UserStatus } from '@interviewiq/shared';

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
}

export interface StoredSession {
  token: string;
  user: StoredUser;
  expiresAt: Date;
}

const usersByEmail = new Map<string, StoredUser>();
const usersById = new Map<string, StoredUser>();
const sessionsByToken = new Map<string, StoredSession>();

export const userStore = {
  saveUser(user: StoredUser): StoredUser {
    usersByEmail.set(user.email.toLowerCase(), user);
    usersById.set(user.id, user);
    return user;
  },

  findUserByEmail(email: string): StoredUser | undefined {
    return usersByEmail.get(email.toLowerCase());
  },

  findUserById(id: string): StoredUser | undefined {
    return usersById.get(id);
  },

  saveSession(token: string, user: StoredUser): StoredSession {
    const session: StoredSession = {
      token,
      user,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };
    sessionsByToken.set(token, session);
    return session;
  },

  findSession(token: string): StoredSession | undefined {
    const session = sessionsByToken.get(token);
    if (!session) return undefined;

    // Expired sessions must never authenticate anything
    if (session.expiresAt <= new Date()) {
      sessionsByToken.delete(token);
      return undefined;
    }

    return session;
  },

  deleteSession(token: string): void {
    sessionsByToken.delete(token);
  },
};
