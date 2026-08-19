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

  async createRazorpayOrder(candidateId: string, bookingId: string) {
    const booking = await this.repository.getBookingWithCandidateAndInterviewer(bookingId);
    if (!booking) throw errors.notFound('Booking');
    if (booking.candidateId !== candidateId) throw errors.forbidden('You can only pay for your own bookings');

    const amountInPaise = booking.totalAmountCents || 100000;

    if (env.RAZORPAY_KEY_ID === 'rzp_test_mock_key') {
      return {
        orderId: `order_mock_${Date.now()}`,
        amount: amountInPaise,
        currency: 'INR',
        keyId: env.RAZORPAY_KEY_ID,
      };
    }

    const { razorpay } = await import('../../lib/razorpay');
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${booking.id}`,
      notes: { bookingId: booking.id, candidateId },
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: env.RAZORPAY_KEY_ID,
    };
  }

  async verifyRazorpayPayment(
    candidateId: string,
    input: { bookingId: string; razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string },
  ) {
    const booking = await this.repository.getBookingWithCandidateAndInterviewer(input.bookingId);
    if (!booking) throw errors.notFound('Booking');
    if (booking.candidateId !== candidateId) throw errors.forbidden('Forbidden');

    if (env.RAZORPAY_KEY_SECRET !== 'mock_secret') {
      const crypto = await import('crypto');
      const body = `${input.razorpayOrderId}|${input.razorpayPaymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      if (expectedSignature !== input.razorpaySignature) {
        throw errors.badRequest('Invalid payment signature');
      }
    }

    const { booking: confirmedBooking } = await this.repository.confirmPaymentAndInitializeRoom(
      booking.id,
      input.razorpayPaymentId || `txn_${Date.now()}`,
      booking.totalAmountCents,
    );

    return { success: true, bookingId: confirmedBooking.id };
  }

  async getPaymentStatus(bookingId: string) {
    const booking = await this.repository.getBookingWithCandidateAndInterviewer(bookingId);
    return {
      status: booking?.payment?.status || PaymentStatus.SUCCEEDED,
    };
  }
}

export const paymentsService = new PaymentsService(paymentsRepository);
