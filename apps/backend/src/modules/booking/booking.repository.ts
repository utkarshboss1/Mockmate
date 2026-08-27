// ============================================================
// booking.repository.ts — Database Access for Bookings
// ============================================================

import { prisma, isDbConnected } from '../../lib/prisma';
import { CreateBookingInput, GetBookingsQueryInput } from './booking.validator';
import { BookingStatus } from '@interviewiq/shared';
import { Prisma } from '@prisma/client';
import { bookingStore } from '../../lib/bookingStore';
import { userStore } from '../../lib/userStore';

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
      const user = userStore.findUserById(candidateId);
      const stored = bookingStore.saveBooking({
        id: `b_${Date.now()}`,
        candidateId,
        interviewerProfileId: input.interviewerProfileId,
        scheduledAt: new Date(input.scheduledAt),
        durationMinutes: 60,
        interviewType: input.interviewType,
        status: BookingStatus.PENDING,
        totalAmountCents: financials.totalAmountCents,
        platformFeeCents: financials.platformFeeCents,
        interviewerPayoutCents: financials.interviewerPayoutCents,
        notes: input.notes || null,
        candidate: {
          id: candidateId,
          name: user?.name || 'Candidate',
          email: user?.email || 'candidate@mock.com',
          avatar: null,
        },
        interviewerProfile: {
          id: input.interviewerProfileId,
          userId: 'int_u_1',
          user: { id: 'int_u_1', name: 'Interviewer', email: 'interviewer@mock.com', avatar: null },
        },
        payment: null,
        interview: null,
      });
      return stored as any;
    }

    const requestedStart = new Date(input.scheduledAt);
    const DURATION_MINUTES = 60;
    const requestedEnd = new Date(requestedStart.getTime() + DURATION_MINUTES * 60 * 1000);

    // Serializable isolation prevents the classic check-then-insert race where
    // two concurrent bookings for the same slot both pass the overlap check.
    return prisma.$transaction(
      async (tx) => {
        // 1. Check for overlapping non-cancelled bookings.
        // Bounded by the requested time window — never loads all bookings.
        const conflictingBookings = await tx.booking.findMany({
          where: {
            interviewerProfileId: input.interviewerProfileId,
            status: {
              notIn: [BookingStatus.CANCELLED_BY_CANDIDATE, BookingStatus.CANCELLED_BY_INTERVIEWER],
            },
            // Pre-filter in the DB to bookings that could possibly overlap
            scheduledAt: { lt: requestedEnd },
          },
          select: { scheduledAt: true, durationMinutes: true },
        });

        const hasConflict = conflictingBookings.some((b) => {
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
            durationMinutes: DURATION_MINUTES,
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
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
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
      const stored = bookingStore.findBookingById(id);
      if (stored) return stored as any;
      return SAMPLE_BOOKINGS.find((b) => b.id === id) as any || ({ ...SAMPLE_BOOKINGS[0], id } as any);
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
