// ============================================================
// booking.repository.ts — Database Access for Bookings
// ============================================================

import { prisma, isDbConnected } from '../../lib/prisma';
import { CreateBookingInput, GetBookingsQueryInput } from './booking.validator';
import { BookingStatus, PaymentStatus, InterviewStatus } from '@interviewiq/shared';
import { Prisma } from '@prisma/client';
import { mockBookingStore as bookingStore } from '../../mockStore/bookingStore';
import { mockUserStore as userStore } from '../../mockStore/userStore';

const SAMPLE_BOOKINGS = [
  {
    id: 'b_1',
    candidateId: 'candidate_1',
    interviewerProfileId: 'int_1',
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    durationMinutes: 60,
    interviewType: 'TECHNICAL_CODING',
    status: 'CONFIRMED',
    totalAmountPaise: 150000,
    platformFeePaise: 22500,
    interviewerPayoutPaise: 127500,
    paymentDueAt: null,
    notes: 'Please review Graph BFS/DFS before the session.',
    candidate: { id: 'candidate_1', name: 'Mock Candidate', email: 'candidate@mock.com', avatar: null },
    interviewerProfile: {
      id: 'int_1',
      user: { id: 'u_1', name: 'Aarav Sharma', email: 'aarav@mock.com', avatar: null }
    },
    payment: { id: 'p_1', status: 'SUCCEEDED' },
    interview: { id: 'i_1', status: 'ACTIVE', roomName: 'room_1' },
    feedback: null,
    review: null
  }
];

// Statuses that make an interviewer's slot unavailable to new bookings.
// EXPIRED bookings release their slot (payment never completed).
const SLOT_BLOCKING_STATUSES = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.COMPLETED,
  BookingStatus.NO_SHOW,
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
      totalAmountPaise: number;
      platformFeePaise: number;
      interviewerPayoutPaise: number;
      paymentDueAt: Date;
    },
    options?: {
      useCredit?: boolean;
    },
  ) {
    const isCreditBooking = Boolean(options?.useCredit);
    const initialStatus = isCreditBooking ? BookingStatus.CONFIRMED : BookingStatus.PENDING;

    if (!isDbConnected()) {
      const user = userStore.findUserById(candidateId);
      const stored = bookingStore.saveBooking({
        id: `b_${Date.now()}`,
        candidateId,
        interviewerProfileId: input.interviewerProfileId,
        scheduledAt: new Date(input.scheduledAt),
        durationMinutes: 60,
        interviewType: input.interviewType,
        status: initialStatus,
        totalAmountPaise: isCreditBooking ? 0 : financials.totalAmountPaise,
        platformFeePaise: isCreditBooking ? 0 : financials.platformFeePaise,
        interviewerPayoutPaise: financials.interviewerPayoutPaise,
        paymentDueAt: financials.paymentDueAt,
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
        // 1. Check for overlapping bookings that hold the slot.
        // Bounded by the requested time window — never loads all bookings.
        const conflictingBookings = await tx.booking.findMany({
          where: {
            interviewerProfileId: input.interviewerProfileId,
            status: { in: SLOT_BLOCKING_STATUSES },
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

        // Deduct 1 credit if booking with credit
        if (isCreditBooking) {
          await tx.user.update({
            where: { id: candidateId },
            data: {
              interviewCredits: {
                decrement: 1,
              },
            },
          });
        }

        // 2. Create the booking record
        const newBooking = await tx.booking.create({
          data: {
            candidateId,
            interviewerProfileId: input.interviewerProfileId,
            scheduledAt: requestedStart,
            durationMinutes: DURATION_MINUTES,
            interviewType: input.interviewType,
            status: initialStatus,
            totalAmountPaise: isCreditBooking ? 0 : financials.totalAmountPaise,
            platformFeePaise: isCreditBooking ? 0 : financials.platformFeePaise,
            interviewerPayoutPaise: financials.interviewerPayoutPaise,
            paymentDueAt: financials.paymentDueAt,
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

        if (isCreditBooking) {
          await tx.payment.create({
            data: {
              bookingId: newBooking.id,
              razorpayOrderId: `pass_credit_${Date.now()}`,
              amountPaise: 0,
              currency: 'inr',
              status: PaymentStatus.SUCCEEDED,
            },
          });
          await tx.interview.create({
            data: {
              bookingId: newBooking.id,
              status: InterviewStatus.WAITING,
            },
          });
        }

        return newBooking;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async getCandidateBookings(candidateId: string, query: GetBookingsQueryInput) {
    if (!isDbConnected()) {
      const userBookings = bookingStore.findBookingsByCandidate(candidateId);
      if (userBookings.length > 0) {
        return { total: userBookings.length, items: userBookings as any };
      }

      // If user has not created any bookings yet, attribute the demo booking
      // to this candidate so they can test viewing, paying, and cancelling it.
      let sample = bookingStore.findBookingById('b_1');
      if (!sample) {
        const user = userStore.findUserById(candidateId);
        sample = bookingStore.saveBooking({
          ...SAMPLE_BOOKINGS[0],
          candidateId,
          candidate: {
            id: candidateId,
            name: user?.name || 'Mock Candidate',
            email: user?.email || 'candidate@mock.com',
            avatar: null,
          },
        } as any);
      }
      return { total: 1, items: [sample] as any };
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
      const interviewerBookings = bookingStore.findBookingsByInterviewer(interviewerProfileId);
      if (interviewerBookings.length > 0) {
        return { total: interviewerBookings.length, items: interviewerBookings as any };
      }
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
      return SAMPLE_BOOKINGS.find((b) => b.id === id) as any || null;
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
      const updated = bookingStore.updateBookingStatus(id, status, notes);
      if (updated) {
        return updated as any;
      }
      const sample = SAMPLE_BOOKINGS.find((b) => b.id === id) || SAMPLE_BOOKINGS[0];
      const saved = bookingStore.saveBooking({
        ...sample,
        id,
        status,
        notes: notes || sample.notes,
      } as any);
      return saved as any;
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