// ============================================================
// auth.service.ts — Auth Business Logic Layer
// ============================================================

import { auth } from '../../lib/auth';
import { authRepository, AuthRepository } from './auth.repository';
import { RegisterInput, LoginInput } from './auth.validator';
import { errors } from '../../middleware/error.middleware';
import { UserRole, UserStatus } from '@interviewiq/shared';
import { isDbConnected } from '../../lib/prisma';
import { userStore } from '../../lib/userStore';

export class AuthService {
  constructor(private repository: AuthRepository) {}

  async register(input: RegisterInput, headers: Headers) {
    if (!isDbConnected()) {
      const existing = userStore.findUserByEmail(input.email);
      if (existing) {
        throw errors.conflict('An account with this email already exists');
      }

      const newUser = userStore.saveUser({
        id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: input.name,
        email: input.email,
        role: input.role,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
      });

      const token = `session_${newUser.id}_${Date.now()}`;
      userStore.saveSession(token, newUser);

      return {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
        },
        session: token,
      };
    }

    const existing = await this.repository.findUserByEmail(input.email);
    if (existing) {
      throw errors.conflict('An account with this email already exists');
    }

    const signUpResult = await auth.api.signUpEmail({
      body: {
        name: input.name,
        email: input.email,
        password: input.password,
      },
      headers,
    });

    if (!signUpResult || !signUpResult.user) {
      throw errors.internal('Failed to create account');
    }

    const userId = signUpResult.user.id;

    // Role assignment + profile stub must succeed together. If either fails,
    // compensate by removing the partially-created account so we never leave
    // a user stuck with the wrong role or without their interviewer profile.
    try {
      const updatedUser = await this.repository.updateUserRole(userId, input.role);

      if (input.role === UserRole.INTERVIEWER) {
        await this.repository.createInterviewerProfileStub(userId);
      }

      return {
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          status: updatedUser.status,
        },
        session: signUpResult.token,
      };
    } catch (err) {
      try {
        await this.repository.deleteUserById(userId);
      } catch (_) {
        console.error(`Failed to clean up partially created user ${userId}`);
      }
      throw err;
    }
  }

  async login(input: LoginInput, headers: Headers) {
    if (!isDbConnected()) {
      let existingUser = userStore.findUserByEmail(input.email);

      if (!existingUser) {
        // Dev-only offline mode: role comes from explicit loginRole, never
        // from substrings of the email address.
        const requestedRole = (input as any).loginRole;
        const role =
          requestedRole === UserRole.ADMIN || requestedRole === UserRole.INTERVIEWER
            ? requestedRole
            : UserRole.CANDIDATE;

        // Format clean display name from email (e.g. "alex.smith@gmail.com" -> "Alex Smith")
        const usernamePart = input.email.split('@')[0];
        const formattedName = usernamePart
          .replace(/[._-]/g, ' ')
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        existingUser = userStore.saveUser({
          id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: formattedName || 'User',
          email: input.email,
          role,
          status: UserStatus.ACTIVE,
          createdAt: new Date(),
        });
      }

      const token = `session_${existingUser.id}_${Date.now()}`;
      userStore.saveSession(token, existingUser);

      return {
        user: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
          status: existingUser.status,
          avatar: null,
        },
        session: token,
      };
    }

    const signInResult = await auth.api.signInEmail({
      body: {
        email: input.email,
        password: input.password,
      },
      headers,
    });

    if (!signInResult || !signInResult.user) {
      throw errors.unauthorized('Invalid email or password');
    }

    const user = await this.repository.findUserById(signInResult.user.id);
    if (!user) {
      throw errors.notFound('User record not found');
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
      },
      session: signInResult.token,
    };
  }

  async getCurrentUser(userId: string) {
    if (!isDbConnected()) {
      let role = UserRole.CANDIDATE;
      if (userId.includes('interviewer')) {
        role = UserRole.INTERVIEWER;
      } else if (userId.includes('admin')) {
        role = UserRole.ADMIN;
      }
      return {
        id: userId,
        name: `Mock ${role.charAt(0) + role.slice(1).toLowerCase()}`,
        email: `${role.toLowerCase()}@mock.com`,
        role,
        status: 'ACTIVE',
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw errors.notFound('User');
    }
    return user;
  }
}

export const authService = new AuthService(authRepository);
