// ============================================================
// auth.repository.ts — Database access layer for Auth
// ============================================================

import { prisma } from '../../lib/prisma';
import { UserRole } from '@interviewiq/shared';

export class AuthRepository {
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        interviewerProfile: true,
      },
    });
  }

  async deleteUserById(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  }

  async updateUserRole(userId: string, role: UserRole) {
    return prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }

  async createInterviewerProfileStub(userId: string) {
    return prisma.interviewerProfile.create({
      data: {
        userId,
        headline: 'Experienced Mock Interviewer',
        bio: 'Welcome! I help candidates prepare for technical and behavioral interviews.',
        pricePerHour: 50000, // Default ₹500/hr in paise
      },
    });
  }
}

export const authRepository = new AuthRepository();
