// ============================================================
// payments.service.ts — Instant Booking & Payments Service
// ============================================================

import { paymentsRepository, PaymentsRepository } from './payments.repository';
import { env } from '../../config/env';
import { errors } from '../../middleware/error.middleware';
import { PaymentStatus } from '@interviewiq/shared';

export class PaymentsService {
  constructor(private repository: PaymentsRepository) {}

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

    // Signature verification is ALWAYS enforced. The only bypass is a mock
    // order created in non-production when Razorpay keys are not configured.
    const isMockOrder = input.razorpayOrderId.startsWith('order_mock_');
    const isMockMode =
      env.RAZORPAY_KEY_SECRET === 'mock_secret' && env.NODE_ENV !== 'production';

    if (!(isMockMode && isMockOrder)) {
      const crypto = await import('crypto');
      const body = `${input.razorpayOrderId}|${input.razorpayPaymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      if (!input.razorpaySignature || expectedSignature !== input.razorpaySignature) {
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

  async getPaymentStatus(bookingId: string, candidateId: string) {
    const booking = await this.repository.getBookingWithCandidateAndInterviewer(bookingId);
    if (!booking) throw errors.notFound('Booking');
    if (booking.candidateId !== candidateId) {
      throw errors.forbidden('You can only view payment status for your own bookings');
    }

    return {
      status: booking.payment?.status ?? PaymentStatus.PENDING,
    };
  }
}

export const paymentsService = new PaymentsService(paymentsRepository);
