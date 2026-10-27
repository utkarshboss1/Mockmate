// ============================================================
// auth.middleware.ts — Authentication & RBAC Middlewares
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth';
import { errors } from './error.middleware';
import { UserRole, UserStatus } from '@interviewiq/shared';
import { prisma } from '../lib/prisma';
import { isMockStorage } from '../mockStore/mode';
import { env } from '../config/env';
import { mockUserStore as userStore } from '../mockStore/userStore';

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Lookup in-memory userStore session first (persists genuine registered/logged in users)
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      const storedSession = userStore.findSession(token);

      if (storedSession) {
        req.user = {
          id: storedSession.user.id,
          email: storedSession.user.email,
          name: storedSession.user.name,
          role: storedSession.user.role,
          status: storedSession.user.status,
        };
        return next();
      }
    }

    // Fallback for explicit sample mock tokens if database is offline.
    // Restricted to exact, non-guessable dev-only tokens — never match on
    // substrings of the header (a real token could contain "admin").
    if (isMockStorage() && env.NODE_ENV !== 'production' && env.ALLOW_MOCK_AUTH) {
      const MOCK_TOKENS: Record<string, { role: UserRole; name: string; id: string }> = {
        'mock-token-admin': { role: UserRole.ADMIN, name: 'Mock Admin', id: 'admin_1' },
        'mock-token-interviewer': {
          role: UserRole.INTERVIEWER,
          name: 'Mock Interviewer',
          id: 'interviewer_1',
        },
        'mock-token-candidate': {
          role: UserRole.CANDIDATE,
          name: 'Mock Candidate',
          id: 'candidate_1',
        },
      };

      const token = (authHeader ?? '').replace(/^Bearer\s+/i, '').trim();
      const mock = MOCK_TOKENS[token];
      if (!mock) {
        throw errors.unauthorized('Authentication required');
      }

      req.user = {
        id: mock.id,
        email: `${mock.role.toLowerCase()}@mock.com`,
        name: mock.name,
        role: mock.role,
        status: UserStatus.ACTIVE,
      };
      return next();
    }

    let dbUser: any = null;

    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (session && session.user) {
      dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, email: true, name: true, role: true, status: true },
      });
    }

    // Fallback: check Bearer token in Authorization header against Prisma session table
    if (!dbUser && req.headers.authorization) {
      const token = req.headers.authorization.replace(/^Bearer\s+/i, '').trim();
      if (token) {
        const sessionRecord = await prisma.session.findUnique({
          where: { token },
          include: { user: true },
        });

        if (sessionRecord && sessionRecord.expiresAt > new Date() && sessionRecord.user) {
          dbUser = sessionRecord.user;
        }
      }
    }

    if (!dbUser) {
      throw errors.unauthorized('Authentication required');
    }

    if (dbUser.status === UserStatus.SUSPENDED) {
      throw errors.forbidden('Your account has been suspended');
    }

    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role as UserRole,
      status: dbUser.status as UserStatus,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(errors.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        errors.forbidden(
          `Access denied. Requires one of the following roles: ${allowedRoles.join(', ')}`,
        ),
      );
    }

    next();
  };
}
