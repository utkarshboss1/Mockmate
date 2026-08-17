// ============================================================
// payments.repository.ts — Database Access for Payments & Rooms
// ============================================================

import { prisma, isDbConnected } from '../../lib/prisma';
import { BookingStatus, PaymentStatus, InterviewStatus } from '@interviewiq/shared';

export class PaymentsRepository {
  async getBookingWithCandidateAndInterviewer(bookingId: string) {
    if (!isDbConnected()) {
      return {
        id: bookingId,
        candidateId: 'candidate_1',
        totalAmountCents: 150000,
        candidate: { id: 'candidate_1', email: 'candidate@mock.com', name: 'Mock Candidate' },
        interviewerProfile: {
          user: { name: 'Aarav Sharma', email: 'aarav@mock.com' }
        },
        payment: null
      } as any;
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

  async upsertPaymentRecord(bookingId: string, stripePaymentIntentId: string, amountCents: number) {
    if (!isDbConnected()) {
      return { id: 'pay_1', bookingId, status: PaymentStatus.PENDING } as any;
    }

    return prisma.payment.upsert({
      where: { bookingId },
      create: {
        bookingId,
        stripePaymentIntentId,
        amountCents,
        currency: 'inr',
        status: PaymentStatus.PENDING,
      },
      update: {
        stripePaymentIntentId,
        amountCents,
        status: PaymentStatus.PENDING,
      },
    });
  }

  async confirmPaymentAndInitializeRoom(
    bookingId: string,
    stripePaymentIntentId: string,
    amountCents = 150000,
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
      // 1. Update Payment status to SUCCEEDED
      const payment = await tx.payment.upsert({
        where: { bookingId },
        create: {
          bookingId,
          stripePaymentIntentId,
          amountCents,
          currency: 'inr',
          status: PaymentStatus.SUCCEEDED,
        },
        update: {
          stripePaymentIntentId,
          amountCents,
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
}

export const paymentsRepository = new PaymentsRepository();
