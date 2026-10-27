// ============================================================
// booking.repository.ts — Database Access for Bookings
// ============================================================

import { prisma } from '../../lib/prisma';
import { CreateBookingInput, GetBookingsQueryInput } from './booking.validator';
import { BookingStatus, PaymentStatus, InterviewStatus } from '@interviewiq/shared';
import { Prisma } from '@prisma/client';


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
    return prisma.interviewerProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async getInterviewerProfileByUserId(userId: string) {
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
