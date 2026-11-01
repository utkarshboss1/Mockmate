// ============================================================
// auth.service.ts — Auth Business Logic Layer
// ============================================================

import { auth } from '../../lib/auth';
import { authRepository, AuthRepository } from './auth.repository';
import { RegisterInput, LoginInput } from './auth.validator';
import { errors } from '../../middleware/error.middleware';
import { UserRole } from '@interviewiq/shared';

export class AuthService {
  constructor(private repository: AuthRepository) {}

  async register(input: RegisterInput, headers: Headers) {
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
      const isAdminEmail = ['utkarshbaj3.14@gmail.com', 'admin@mockmate.in'].includes(input.email.toLowerCase());
      const roleToAssign = isAdminEmail ? UserRole.ADMIN : input.role;

      const updatedUser = await this.repository.updateUserRole(userId, roleToAssign);

      if (roleToAssign === UserRole.INTERVIEWER) {
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

    if (['utkarshbaj3.14@gmail.com', 'admin@mockmate.in'].includes(input.email.toLowerCase())) {
      await this.repository.updateUserRole(signInResult.user.id, UserRole.ADMIN);
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
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw errors.notFound('User');
    }
    return user;
  }
}

export const authService = new AuthService(authRepository);
