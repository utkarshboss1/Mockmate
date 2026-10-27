// ============================================================
// admin.repository.ts — Database Access for Admin & Analytics
// ============================================================

import { prisma } from '../../lib/prisma';
import { isMockStorage } from '../../mockStore/mode';
import { AdminUserQueryInput } from './admin.validator';
import { UserRole, UserStatus, BookingStatus } from '@interviewiq/shared';

export class AdminRepository {
  async getAnalyticsOverview() {
    if (isMockStorage()) {
      return {
        totalUsers: 142,
        totalCandidates: 110,
        totalInterviewers: 32,
        totalBookings: 88,
        completedBookings: 76,
        totalGrossVolumePaise: 8800000,
        totalPlatformRevenuePaise: 1320000,
      };
    }

    const [
      totalUsers,
      totalCandidates,
      totalInterviewers,
      totalBookings,
      completedBookings,
      revenueAggregate,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: UserRole.CANDIDATE } }),
      prisma.user.count({ where: { role: UserRole.INTERVIEWER } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
      prisma.booking.aggregate({
        where: { status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] } },
        _sum: {
          totalAmountPaise: true,
          platformFeePaise: true,
        },
      }),
    ]);

    return {
      totalUsers,
      totalCandidates,
      totalInterviewers,
      totalBookings,
      completedBookings,
      totalGrossVolumePaise: revenueAggregate._sum.totalAmountPaise || 0,
      totalPlatformRevenuePaise: revenueAggregate._sum.platformFeePaise || 0,
    };
  }

  async listUsers(input: AdminUserQueryInput) {
    if (isMockStorage()) {
      const mockUsers: any[] = [
        {
          id: 'usr_cand_1',
          name: 'Alex Johnson',
          email: 'alex@example.com',
          role: UserRole.CANDIDATE,
          status: UserStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'usr_int_1',
          name: 'Priya Sharma',
          email: 'priya@example.com',
          role: UserRole.INTERVIEWER,
          status: UserStatus.ACTIVE,
          interviewerProfile: { id: 'int_mock_1', isVerified: false, headline: 'Software Engineer', bio: 'Mock interviewer profile', pricePerHour: 1500 },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      return { total: mockUsers.length, items: mockUsers };
    }

    const { search, page, limit } = input;
    const where: any = {};

    if (search && search.trim()) {
      const query = search.trim();
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          interviewerProfile: {
            select: { id: true, isVerified: true, headline: true, bio: true, pricePerHour: true },
          },
        },
      }),
    ]);

    return { total, items };
  }

  async updateUserStatus(userId: string, status: UserStatus) {
    if (isMockStorage()) {
      return {
        id: userId,
        name: 'Mock User',
        email: 'user@example.com',
        role: UserRole.CANDIDATE,
        status,
      };
    }

    return prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });
  }

  /**
   * Verify or un-verify an interviewer's profile. Only meaningful for users
   * with an interviewer profile — throws a 404 otherwise.
   */
  async setInterviewerVerified(
    interviewerProfileId: string,
    isVerified: boolean,
  ) {
    if (isMockStorage()) {
      return { id: interviewerProfileId, isVerified, verifiedAt: isVerified ? new Date() : null };
    }

    const profile = await prisma.interviewerProfile.findUnique({
      where: { id: interviewerProfileId },
      select: { id: true },
    });
    if (!profile) {
      return null;
    }

    return prisma.interviewerProfile.update({
      where: { id: interviewerProfileId },
      data: {
        isVerified,
        verifiedAt: isVerified ? new Date() : null,
      },
      select: {
        id: true,
        isVerified: true,
        verifiedAt: true,
        headline: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }
}

export const adminRepository = new AdminRepository();
