// ============================================================
// admin.repository.ts — Database Access for Admin & Analytics
// ============================================================

import { prisma, isDbConnected } from '../../lib/prisma';
import { AdminUserQueryInput } from './admin.validator';
import { UserRole, UserStatus, BookingStatus } from '@interviewiq/shared';
import { Prisma } from '@prisma/client';

export class AdminRepository {
  async getAnalyticsOverview() {
    if (!isDbConnected()) {
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
          totalAmountCents: true,
          platformFeeCents: true,
        },
      }),
    ]);

    return {
      totalUsers,
      totalCandidates,
      totalInterviewers,
      totalBookings,
      completedBookings,
      totalGrossVolumePaise: revenueAggregate._sum.totalAmountCents || 0,
      totalPlatformRevenuePaise: revenueAggregate._sum.platformFeeCents || 0,
    };
  }

  async listUsers(input: AdminUserQueryInput) {
    if (!isDbConnected()) {
      const mockUsers = [
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
        },
      }),
    ]);

    return { total, items };
  }

  async updateUserStatus(userId: string, status: UserStatus) {
    if (!isDbConnected()) {
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
}

export const adminRepository = new AdminRepository();
