// ============================================================
// payments.service.test.ts — Payment Verification Security Tests
//
// Covers the cross-booking signature-reuse vulnerability: a valid
// Razorpay signature tuple from booking A's order must NEVER
// confirm booking B.
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentStatus, BookingStatus } from '@interviewiq/shared';

process.env.NODE_ENV = 'development';
process.env.STORAGE_MODE = 'memory';

import { PaymentsService } from '../modules/payments/payments.service';
import { env } from '../config/env';

/** True when the test run resolved to mock razorpay keys (offline dev). */
const IS_MOCK_RAZORPAY = env.RAZORPAY_KEY_ID === 'rzp_test_mock_key';

function buildService(overrides: Record<string, any> = {}) {
  const repository = {
    getBookingWithCandidateAndInterviewer: vi.fn(),
    recordOrderForBooking: vi.fn(),
    findPaymentByOrderId: vi.fn(),
    confirmPaymentAndInitializeRoom: vi.fn(),
    confirmPaymentByOrderId: vi.fn(),
    markPaymentFailedByOrderId: vi.fn(),
    ...overrides,
  } as any;
  return { service: new PaymentsService(repository), repository };
}

const BOOKING_A = {
  id: 'booking_A',
  candidateId: 'cand_1',
  totalAmountPaise: 150000,
  status: BookingStatus.PENDING,
  payment: { status: PaymentStatus.PENDING, razorpayOrderId: 'order_A' },
  candidate: { id: 'cand_1', email: 'c@x.com', name: 'C' },
  interviewerProfile: {
    userId: 'int_u_1',
    user: { name: 'I', email: 'i@x.com' },
  },
};

const BOOKING_B = {
  ...BOOKING_A,
  id: 'booking_B',
  totalAmountPaise: 500000, // expensive booking
  payment: { status: PaymentStatus.PENDING, razorpayOrderId: 'order_B' },
};

describe('PaymentsService.verifyRazorpayPayment', () => {
  it('rejects a signature tuple from a different booking\'s order', async () => {
    const { service, repository } = buildService({
      getBookingWithCandidateAndInterviewer: vi.fn().mockResolvedValue(BOOKING_B),
      confirmPaymentAndInitializeRoom: vi.fn().mockResolvedValue({
        booking: { id: 'booking_B' },
      }),
    });

    // Attacker submits BOOKING_A's (cheap) order id against BOOKING_B
    await expect(
      service.verifyRazorpayPayment('cand_1', {
        bookingId: 'booking_B',
        razorpayOrderId: 'order_A', // ← foreign order
        razorpayPaymentId: 'pay_A',
        razorpaySignature: 'valid_for_order_A',
      }),
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(repository.confirmPaymentAndInitializeRoom).not.toHaveBeenCalled();
  });

  it('rejects when no order was ever recorded for the booking', async () => {
    const { service, repository } = buildService({
      getBookingWithCandidateAndInterviewer: vi.fn().mockResolvedValue({
        ...BOOKING_A,
        payment: null,
      }),
    });

    await expect(
      service.verifyRazorpayPayment('cand_1', {
        bookingId: 'booking_A',
        razorpayOrderId: 'order_A',
        razorpayPaymentId: 'pay_A',
        razorpaySignature: 'sig',
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('is idempotent — an already-succeeded payment returns without re-confirming', async () => {
    const { service, repository } = buildService({
      getBookingWithCandidateAndInterviewer: vi.fn().mockResolvedValue({
        ...BOOKING_A,
        payment: { status: PaymentStatus.SUCCEEDED, razorpayOrderId: 'order_A' },
      }),
    });

    const result = await service.verifyRazorpayPayment('cand_1', {
      bookingId: 'booking_A',
      razorpayOrderId: 'order_A',
      razorpayPaymentId: 'pay_A',
      razorpaySignature: 'sig',
    });

    expect(result).toEqual({ success: true, bookingId: 'booking_A', alreadyPaid: true });
    expect(repository.confirmPaymentAndInitializeRoom).not.toHaveBeenCalled();
  });

  it('refuses to confirm payment for a cancelled booking', async () => {
    const { service, repository } = buildService({
      getBookingWithCandidateAndInterviewer: vi.fn().mockResolvedValue({
        ...BOOKING_A,
        status: BookingStatus.CANCELLED_BY_CANDIDATE,
      }),
    });

    await expect(
      service.verifyRazorpayPayment('cand_1', {
        bookingId: 'booking_A',
        razorpayOrderId: 'order_A',
        razorpayPaymentId: 'pay_A',
        razorpaySignature: 'sig',
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('PaymentsService.createRazorpayOrder', () => {
  it('refuses to create an order when the booking amount is missing', async () => {
    const { service, repository } = buildService({
      getBookingWithCandidateAndInterviewer: vi.fn().mockResolvedValue({
        ...BOOKING_A,
        totalAmountPaise: 0,
      }),
    });

    await expect(service.createRazorpayOrder('cand_1', 'booking_A')).rejects.toMatchObject({
      statusCode: 500,
    });
    expect(repository.recordOrderForBooking).not.toHaveBeenCalled();
  });

  it('refuses to create an order for an already-paid booking', async () => {
    const { service, repository } = buildService({
      getBookingWithCandidateAndInterviewer: vi.fn().mockResolvedValue({
        ...BOOKING_A,
        payment: { status: PaymentStatus.SUCCEEDED, razorpayOrderId: 'order_A' },
      }),
    });

    await expect(service.createRazorpayOrder('cand_1', 'booking_A')).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it('refuses to create an order for a cancelled booking', async () => {
    const { service } = buildService({
      getBookingWithCandidateAndInterviewer: vi.fn().mockResolvedValue({
        ...BOOKING_A,
        status: BookingStatus.CANCELLED_BY_INTERVIEWER,
      }),
    });

    await expect(service.createRazorpayOrder('cand_1', 'booking_A')).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it('binds the created order to the booking before returning it', async () => {
    const { service, repository } = buildService({
      getBookingWithCandidateAndInterviewer: vi.fn().mockResolvedValue(BOOKING_A),
    });

    const result = await service.createRazorpayOrder('cand_1', 'booking_A');

    if (IS_MOCK_RAZORPAY) {
      expect(result.orderId).toMatch(/^order_mock_/);
    }
    expect(result.amount).toBe(BOOKING_A.totalAmountPaise);
    expect(repository.recordOrderForBooking).toHaveBeenCalledWith(
      'booking_A',
      result.orderId,
      BOOKING_A.totalAmountPaise,
    );
  });
});

describe('PaymentsService.handleRazorpayWebhook', () => {
  it('rejects webhooks with an invalid signature', async () => {
    const { service } = buildService();
    await expect(
      service.handleRazorpayWebhook('{"event":"payment.captured"}', 'bad_signature'),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('rejects webhooks with no signature header', async () => {
    const { service } = buildService();
    await expect(
      service.handleRazorpayWebhook('{"event":"payment.captured"}', ''),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('accepts a correctly-signed webhook payload', async () => {
    const { service, repository } = buildService({
      confirmPaymentByOrderId: vi.fn().mockResolvedValue({ booking: { id: 'b1' } }),
    });

    const crypto = await import('crypto');
    const rawBody = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_1', order_id: 'order_1' } } },
    });
    // Sign with the SAME secret the running env resolved to.
    const signature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    const result = await service.handleRazorpayWebhook(rawBody, signature);
    expect(result).toEqual({ received: true, confirmed: true });
    expect(repository.confirmPaymentByOrderId).toHaveBeenCalledWith('order_1', 'pay_1');
  });
});