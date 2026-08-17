// ============================================================
// payments.service.ts — Instant Booking & Payments Service
// ============================================================

import { paymentsRepository, PaymentsRepository } from './payments.repository';
import { env } from '../../config/env';
import { errors } from '../../middleware/error.middleware';
import { BookingStatus, PaymentStatus } from '@interviewiq/shared';

export class PaymentsService {
  constructor(private repository: PaymentsRepository) {}

  async createCheckoutSession(candidateId: string, bookingId: string) {
    const booking = await this.repository.getBookingWithCandidateAndInterviewer(bookingId);
    if (!booking) {
      throw errors.notFound('Booking');
    }

    if (booking.candidateId !== candidateId) {
      throw errors.forbidden('You can only pay for your own bookings');
    }

    if (booking.status === BookingStatus.CONFIRMED) {
      throw errors.badRequest('This booking has already been paid for and confirmed');
    }

    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Instantly confirm payment & room allocation
    const { booking: confirmedBooking } = await this.repository.confirmPaymentAndInitializeRoom(
      booking.id,
      transactionId,
      booking.totalAmountCents,
    );

    // Trigger In-App Notification & Email
    try {
      const { notificationService } = await import('../notification/notification.service');
      const bookingFull = await this.repository.getBookingWithCandidateAndInterviewer(bookingId);
      if (bookingFull) {
        void notificationService.notifyBookingConfirmed({
          candidateId: bookingFull.candidateId,
          candidateEmail: bookingFull.candidate.email,
          interviewerUserId: bookingFull.interviewerProfile.userId,
          interviewerEmail: bookingFull.interviewerProfile.user.email,
          interviewerName: bookingFull.interviewerProfile.user.name,
          candidateName: bookingFull.candidate.name,
          scheduledAt: bookingFull.scheduledAt ? new Date(bookingFull.scheduledAt).toISOString() : new Date().toISOString(),
          bookingId: bookingFull.id,
        });
      }
    } catch (err) {
      console.warn('Failed to send booking notification:', err);
    }

    return {
      url: `${env.FRONTEND_URL}/dashboard?payment=success&bookingId=${confirmedBooking.id}`,
    };
  }

  async getPaymentStatus(bookingId: string) {
    const booking = await this.repository.getBookingWithCandidateAndInterviewer(bookingId);
    return {
      status: booking?.payment?.status || PaymentStatus.SUCCEEDED,
    };
  }
}

export const paymentsService = new PaymentsService(paymentsRepository);
