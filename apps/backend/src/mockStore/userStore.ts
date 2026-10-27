// In-memory user and session storage for memory mode.

import { UserRole, UserStatus } from '@interviewiq/shared';

export interface MockStoredUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
}

export interface MockStoredSession {
  token: string;
  user: MockStoredUser;
  expiresAt: Date;
}

const usersByEmail = new Map<string, MockStoredUser>();
const usersById = new Map<string, MockStoredUser>();
const sessionsByToken = new Map<string, MockStoredSession>();

export const mockUserStore = {
  saveUser(user: MockStoredUser): MockStoredUser {
    usersByEmail.set(user.email.toLowerCase(), user);
    usersById.set(user.id, user);
    return user;
  },

  findUserByEmail(email: string): MockStoredUser | undefined {
    return usersByEmail.get(email.toLowerCase());
  },

  findUserById(id: string): MockStoredUser | undefined {
    return usersById.get(id);
  },

  saveSession(token: string, user: MockStoredUser): MockStoredSession {
    const session: MockStoredSession = {
      token,
      user,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };
    sessionsByToken.set(token, session);
    return session;
  },

  findSession(token: string): MockStoredSession | undefined {
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
