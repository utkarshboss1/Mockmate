// ============================================================
// payments.service.ts — Instant Booking & Payments Service
// ============================================================

import { paymentsRepository, PaymentsRepository } from './payments.repository';
import { env } from '../../config/env';
import { errors } from '../../middleware/error.middleware';
import { BookingStatus, PaymentStatus } from '@interviewiq/shared';
import { PurchasePassInput } from './payments.validator';

export class PaymentsService {
  constructor(private repository: PaymentsRepository) {}

  async createRazorpayOrder(candidateId: string, bookingId: string) {
    const booking = await this.repository.getBookingWithCandidateAndInterviewer(bookingId);
    if (!booking) throw errors.notFound('Booking');
    if (booking.candidateId !== candidateId) throw errors.forbidden('You can only pay for your own bookings');

    // Status gates: never create a new order for an already-paid, cancelled,
    // expired or completed booking.
    if (booking.payment?.status === PaymentStatus.SUCCEEDED) {
      throw errors.conflict('This booking has already been paid for');
    }
    if (
      booking.status === BookingStatus.CANCELLED_BY_CANDIDATE ||
      booking.status === BookingStatus.CANCELLED_BY_INTERVIEWER ||
      booking.status === BookingStatus.EXPIRED ||
      booking.status === BookingStatus.COMPLETED
    ) {
      throw errors.conflict('This booking can no longer be paid for');
    }

    // Amount must come from the persisted booking record — never default.
    if (!booking.totalAmountPaise || booking.totalAmountPaise <= 0) {
      throw errors.internal('Booking amount is invalid — refusing to create payment order');
    }
    const amountPaise = booking.totalAmountPaise;

    // Mock mode (dev only): keep the same order-creation shape so the
    // binding + verify path is exercised end-to-end offline.
    if (env.RAZORPAY_KEY_ID === 'rzp_test_mock_key') {
      const orderId = `order_mock_${Date.now()}`;
      await this.repository.recordOrderForBooking(booking.id, orderId, amountPaise);
      return {
        orderId,
        amount: amountPaise,
        currency: 'INR',
        keyId: env.RAZORPAY_KEY_ID,
      };
    }

    const { razorpay } = await import('../../lib/razorpay');
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `receipt_${booking.id}`,
      notes: { bookingId: booking.id, candidateId },
    });
    // Razorpay SDK types amount as string | number — normalize once, here.
    const orderAmount = Number(order.amount);

    // Bind the order to this booking BEFORE it is returned to the client.
    await this.repository.recordOrderForBooking(booking.id, order.id, orderAmount);

    return {
      orderId: order.id,
      amount: orderAmount,
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

    // Idempotency: already paid → return success without re-confirming.
    if (booking.payment?.status === PaymentStatus.SUCCEEDED) {
      return { success: true, bookingId: booking.id, alreadyPaid: true };
    }

    if (
      booking.status === BookingStatus.CANCELLED_BY_CANDIDATE ||
      booking.status === BookingStatus.CANCELLED_BY_INTERVIEWER ||
      booking.status === BookingStatus.EXPIRED
    ) {
      throw errors.conflict('This booking was cancelled or expired — payment cannot be confirmed');
    }

    // CRITICAL: the order id in the verify payload must match the order we
    // created for THIS booking. Without this check, a valid signature from a
    // cheap order could confirm a more expensive booking.
    if (!booking.payment || booking.payment.razorpayOrderId !== input.razorpayOrderId) {
      throw errors.badRequest('Payment order does not belong to this booking');
    }

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
      input.razorpayPaymentId,
      booking.totalAmountPaise,
    );

    // Booking-confirmed notification (in-app + email, non-blocking)
    const { notificationService } = await import('../notification/notification.service');
    void notificationService.notifyBookingConfirmed({
      candidateId: booking.candidateId,
      candidateEmail: booking.candidate.email,
      candidateName: booking.candidate.name,
      interviewerUserId: booking.interviewerProfile.userId,
      interviewerEmail: booking.interviewerProfile.user.email,
      interviewerName: booking.interviewerProfile.user.name,
      scheduledAt: new Date(booking.scheduledAt).toISOString(),
      bookingId: booking.id,
    });

    return { success: true, bookingId: confirmedBooking.id };
  }

  /**
   * Razorpay webhook handler — the source of truth for payment state.
   * Verifies the x-razorpay-signature HMAC over the raw body, then
   * confirms or fails the payment bound to the order id in the payload.
   */
  async handleRazorpayWebhook(rawBody: string, signature: string) {
    if (!signature) {
      throw errors.unauthorized('Missing webhook signature');
    }

    const crypto = await import('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    // timingSafeEqual throws on length mismatch — guard before comparing so
    // a malformed signature becomes a 401, not a 500.
    const expected = Buffer.from(expectedSignature);
    const received = Buffer.from(signature);
    const isValid =
      expected.length === received.length && crypto.timingSafeEqual(expected, received);
    if (!isValid) {
      throw errors.unauthorized('Invalid webhook signature');
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      throw errors.badRequest('Invalid webhook payload');
    }

    const razorpayOrderId = event?.payload?.payment?.entity?.order_id;
    const razorpayPaymentId = event?.payload?.payment?.entity?.id;

    if (!razorpayOrderId || !razorpayPaymentId) {
      return { received: true };
    }

    if (event.event === 'payment.captured' || event.event === 'payment.authorized') {
      const result = await this.repository.confirmPaymentByOrderId(
        razorpayOrderId,
        razorpayPaymentId,
      );
      return { received: true, confirmed: Boolean(result) };
    }

    if (event.event === 'payment.failed') {
      await this.repository.markPaymentFailedByOrderId(razorpayOrderId);
      return { received: true, failed: true };
    }

    return { received: true };
  }

  async purchasePass(userId: string, input: PurchasePassInput) {
    const creditsMap: Record<string, number> = {
      pro: 3,
      faang_loop: 8,
    };
    const creditsToAdd = creditsMap[input.planId] ?? 3;
    const durationDays = input.isAnnual ? 365 : 30;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    const updatedUser = await this.repository.activateUserPass(
      userId,
      input.planId,
      creditsToAdd,
      expiresAt,
    );

    return {
      planId: input.planId,
      activePlan: updatedUser.activePlan,
      creditsAdded: creditsToAdd,
      totalCredits: updatedUser.interviewCredits,
      expiresAt: updatedUser.planExpiresAt,
      user: updatedUser,
    };
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