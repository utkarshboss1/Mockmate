// ============================================================
// admin.repository.ts — Database Access for Admin & Analytics
// ============================================================

import { prisma } from '../../lib/prisma';
import { AdminUserQueryInput } from './admin.validator';
import { UserRole, UserStatus, BookingStatus } from '@interviewiq/shared';

export class AdminRepository {
  async getAnalyticsOverview() {
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
