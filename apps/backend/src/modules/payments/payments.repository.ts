// ============================================================
// payments.repository.ts — Database Access for Payments & Rooms
// ============================================================

import { prisma, isDbConnected } from '../../lib/prisma';
import { BookingStatus, PaymentStatus, InterviewStatus } from '@interviewiq/shared';
import { mockBookingStore as bookingStore } from '../../mockStore/bookingStore';

export class PaymentsRepository {
  async getBookingWithCandidateAndInterviewer(bookingId: string) {
    if (!isDbConnected()) {
      const stored = bookingStore.findBookingById(bookingId);
      if (stored) {
        return stored as any;
      }
      return null;
    }

    return prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        candidate: { select: { id: true, email: true, name: true } },
        interviewerProfile: {
          include: { user: { select: { name: true, email: true } } },
        },
        payment: true,
      },
    });
  }

  /**
   * Persist the Razorpay order id against the booking's payment record at
   * order-creation time. This binding is what the verify path checks —
   * a signature tuple from a different booking's order can never match.
   */
  async recordOrderForBooking(
    bookingId: string,
    razorpayOrderId: string,
    amountPaise: number,
  ) {
    if (!isDbConnected()) {
      return { id: 'pay_1', bookingId, razorpayOrderId, amountPaise, status: PaymentStatus.PENDING } as any;
    }

    return prisma.payment.upsert({
      where: { bookingId },
      create: {
        bookingId,
        razorpayOrderId,
        amountPaise,
        currency: 'inr',
        status: PaymentStatus.PENDING,
      },
      update: {
        razorpayOrderId,
        amountPaise,
        status: PaymentStatus.PENDING,
      },
    });
  }

  async activateUserPass(userId: string, planId: string, creditsToAdd: number, expiresAt: Date) {
    if (!isDbConnected()) {
      return {
        id: userId,
        activePlan: planId === 'pro' ? 'PRO_PREP' : 'FAANG_ALL_ACCESS',
        interviewCredits: creditsToAdd,
        planExpiresAt: expiresAt,
      } as any;
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        activePlan: planId === 'pro' ? 'PRO_PREP' : 'FAANG_ALL_ACCESS',
        planExpiresAt: expiresAt,
        interviewCredits: {
          increment: creditsToAdd,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        activePlan: true,
        planExpiresAt: true,
        interviewCredits: true,
      },
    });
  }

  async findPaymentByOrderId(razorpayOrderId: string) {
    if (!isDbConnected()) {
      return null;
    }
    return prisma.payment.findUnique({
      where: { razorpayOrderId },
      include: {
        booking: {
          include: {
            candidate: { select: { id: true, email: true, name: true } },
            interviewerProfile: {
              include: { user: { select: { name: true, email: true } } },
            },
          },
        },
      },
    });
  }

  async confirmPaymentAndInitializeRoom(
    bookingId: string,
    razorpayPaymentId: string,
    amountPaise: number,
  ) {
    if (!isDbConnected()) {
      return {
        booking: {
          id: bookingId,
          candidateId: 'candidate_1',
          scheduledAt: new Date(),
          status: BookingStatus.CONFIRMED,
        },
        payment: { id: 'pay_1', status: PaymentStatus.SUCCEEDED },
        interview: { id: 'int_1', roomName: 'room_1' }
      } as any;
    }

    return prisma.$transaction(async (tx: any) => {
      // 1. Update Payment status to SUCCEEDED (bounded to this booking)
      const payment = await tx.payment.update({
        where: { bookingId },
        data: {
          razorpayPaymentId,
          amountPaise,
          status: PaymentStatus.SUCCEEDED,
        },
      });

      // 2. Update Booking status to CONFIRMED
      const booking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CONFIRMED },
      });

      // 3. Create or get Interview Room (LiveKit)
      const interview = await tx.interview.upsert({
        where: { bookingId },
        create: {
          bookingId,
          status: InterviewStatus.WAITING,
        },
        update: {},
      });

      return { booking, payment, interview };
    });
  }

  /**
   * Webhook path: confirm a payment identified only by its Razorpay order id.
   * Used when payment.captured arrives without a client-side verify round-trip.
   */
  async confirmPaymentByOrderId(razorpayOrderId: string, razorpayPaymentId: string) {
    if (!isDbConnected()) {
      return null;
    }

    return prisma.$transaction(async (tx: any) => {
      const payment = await tx.payment.update({
        where: { razorpayOrderId },
        data: {
          razorpayPaymentId,
          status: PaymentStatus.SUCCEEDED,
        },
      });

      // Idempotent: if already CONFIRMED, keep the current state
      const booking = await tx.booking.update({
        where: { id: payment.bookingId },
        data: {
          ...(payment.status !== PaymentStatus.SUCCEEDED
            ? { status: BookingStatus.CONFIRMED }
            : {}),
        },
      });

      const interview = await tx.interview.upsert({
        where: { bookingId: payment.bookingId },
        create: {
          bookingId: payment.bookingId,
          status: InterviewStatus.WAITING,
        },
        update: {},
      });

      return { booking, payment, interview };
    });
  }

  async markPaymentFailedByOrderId(razorpayOrderId: string) {
    if (!isDbConnected()) {
      return null;
    }
    return prisma.payment.update({
      where: { razorpayOrderId },
      data: { status: PaymentStatus.FAILED },
    });
  }
}

export const paymentsRepository = new PaymentsRepository();