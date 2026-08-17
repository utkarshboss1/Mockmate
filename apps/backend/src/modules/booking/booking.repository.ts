// ============================================================
// booking.repository.ts — Database Access for Bookings
// ============================================================

import { prisma, isDbConnected } from '../../lib/prisma';
import { CreateBookingInput, GetBookingsQueryInput } from './booking.validator';
import { BookingStatus, UserRole } from '@interviewiq/shared';
import { Prisma } from '@prisma/client';

const SAMPLE_BOOKINGS = [
  {
    id: 'b_1',
    candidateId: 'candidate_1',
    interviewerProfileId: 'int_1',
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    durationMinutes: 60,
    interviewType: 'TECHNICAL_CODING',
    status: 'CONFIRMED',
    totalAmountCents: 150000,
    platformFeeCents: 22500,
    interviewerPayoutCents: 127500,
    notes: 'Please review Graph BFS/DFS before the session.',
    candidate: { id: 'candidate_1', name: 'Mock Candidate', email: 'candidate@mock.com', avatar: null },
    interviewerProfile: {
      id: 'int_1',
      user: { id: 'u_1', name: 'Aarav Sharma', email: 'aarav@mock.com', avatar: null }
    },
    payment: { id: 'p_1', status: 'SUCCEEDED' },
    interview: { id: 'i_1', status: 'READY', roomName: 'room_1' },
    feedback: null,
    review: null
  }
];

export class BookingRepository {
  async getInterviewerProfileById(id: string) {
    if (!isDbConnected()) {
      return {
        id,
        pricePerHour: 150000,
        user: { name: 'Aarav Sharma', email: 'aarav@mock.com' }
      } as any;
    }
    return prisma.interviewerProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async getInterviewerProfileByUserId(userId: string) {
    if (!isDbConnected()) {
      return { id: 'int_1', userId };
    }
    return prisma.interviewerProfile.findUnique({
      where: { userId },
    });
  }

  async createBookingWithConflictCheck(
    candidateId: string,
    input: CreateBookingInput,
    financials: {
      totalAmountCents: number;
      platformFeeCents: number;
      interviewerPayoutCents: number;
    },
  ) {
    if (!isDbConnected()) {
      return SAMPLE_BOOKINGS[0] as any;
    }

    const requestedStart = new Date(input.scheduledAt);
    const requestedEnd = new Date(requestedStart.getTime() + 60 * 60 * 1000);

    return prisma.$transaction(async (tx: any) => {
      // 1. Check for overlapping non-cancelled bookings
      const activeBookings = await tx.booking.findMany({
        where: {
          interviewerProfileId: input.interviewerProfileId,
          status: {
            notIn: [BookingStatus.CANCELLED_BY_CANDIDATE, BookingStatus.CANCELLED_BY_INTERVIEWER],
          },
        },
      });

      const hasConflict = activeBookings.some((b: any) => {
        const bStart = new Date(b.scheduledAt).getTime();
        const bEnd = bStart + (b.durationMinutes || 60) * 60 * 1000;
        return requestedStart.getTime() < bEnd && requestedEnd.getTime() > bStart;
      });

      if (hasConflict) {
        throw new Error('SLOT_ALREADY_BOOKED');
      }

      // 2. Create the booking record
      return tx.booking.create({
        data: {
          candidateId,
          interviewerProfileId: input.interviewerProfileId,
          scheduledAt: requestedStart,
          durationMinutes: 60,
          interviewType: input.interviewType,
          status: BookingStatus.PENDING,
          totalAmountCents: financials.totalAmountCents,
          platformFeeCents: financials.platformFeeCents,
          interviewerPayoutCents: financials.interviewerPayoutCents,
          notes: input.notes || null,
        },
        include: {
          candidate: { select: { id: true, name: true, email: true, avatar: true } },
          interviewerProfile: {
            include: {
              user: { select: { id: true, name: true, email: true, avatar: true } },
            },
          },
        },
      });
    });
  }

  async getCandidateBookings(candidateId: string, query: GetBookingsQueryInput) {
    if (!isDbConnected()) {
      return { total: SAMPLE_BOOKINGS.length, items: SAMPLE_BOOKINGS as any };
    }

    const { status, page, limit } = query;
    const where: any = { candidateId };
    if (status) where.status = status;

    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        orderBy: { scheduledAt: 'asc' },
        skip,
        take: limit,
        include: {
          interviewerProfile: {
            include: {
              user: { select: { id: true, name: true, avatar: true, email: true } },
            },
          },
          payment: true,
          interview: { select: { id: true, status: true, roomName: true } },
          feedback: { select: { id: true } },
          review: { select: { id: true, rating: true } },
        },
      }),
    ]);

    return { total, items };
  }

  async getInterviewerBookings(interviewerProfileId: string, query: GetBookingsQueryInput) {
    if (!isDbConnected()) {
      if (interviewerProfileId === 'int_1') {
        return { total: SAMPLE_BOOKINGS.length, items: SAMPLE_BOOKINGS as any };
      }
      return { total: 0, items: [] };
    }

    const { status, page, limit } = query;
    const where: any = { interviewerProfileId };
    if (status) where.status = status;

    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        orderBy: { scheduledAt: 'asc' },
        skip,
        take: limit,
        include: {
          candidate: { select: { id: true, name: true, avatar: true, email: true } },
          payment: true,
          interview: { select: { id: true, status: true, roomName: true } },
          feedback: { select: { id: true } },
        },
      }),
    ]);

    return { total, items };
  }

  async getBookingById(id: string) {
    if (!isDbConnected()) {
      return SAMPLE_BOOKINGS[0] as any;
    }

    return prisma.booking.findUnique({
      where: { id },
      include: {
        candidate: { select: { id: true, name: true, email: true, avatar: true } },
        interviewerProfile: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
        payment: true,
        interview: true,
        feedback: true,
        review: true,
      },
    });
  }

  async updateBookingStatus(id: string, status: BookingStatus, notes?: string) {
    if (!isDbConnected()) {
      return SAMPLE_BOOKINGS[0] as any;
    }

    return prisma.booking.update({
      where: { id },
      data: {
        status,
        ...(notes && { notes }),
      },
      include: {
        candidate: { select: { id: true, name: true, email: true } },
        interviewerProfile: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    });
  }
}

export const bookingRepository = new BookingRepository();
