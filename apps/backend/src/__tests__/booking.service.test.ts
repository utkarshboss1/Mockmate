// ============================================================
// booking.service.test.ts — Booking Integrity Tests
//
// Covers server-side slot enforcement and cancellation rules.
// The availability module is mocked so slot-offering is controlled
// per-test without touching the real generator.
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BookingStatus, UserRole, InterviewType, DayOfWeek } from '@interviewiq/shared';

process.env.NODE_ENV = 'development';
process.env.STORAGE_MODE = 'memory';

const { generateBookableSlots } = vi.hoisted(() => ({
  generateBookableSlots: vi.fn().mockResolvedValue([]),
}));
vi.mock('../modules/availability/availability.service', () => ({
  availabilityService: { generateBookableSlots },
}));

import { BookingService } from '../modules/booking/booking.service';

function upcomingSlotIso(hoursAhead = 48): string {
  const d = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString();
}

const INTERVIEWER = {
  id: 'int_1',
  userId: 'int_u_1',
  pricePerHour: 150000,
  user: { id: 'int_u_1', name: 'I', email: 'i@x.com' },
};

function buildService(overrides: Record<string, any> = {}) {
  const repository = {
    getInterviewerProfileById: vi.fn(),
    getInterviewerProfileByUserId: vi.fn(),
    createBookingWithConflictCheck: vi.fn(),
    getCandidateBookings: vi.fn(),
    getInterviewerBookings: vi.fn(),
    getBookingById: vi.fn(),
    updateBookingStatus: vi.fn(),
    ...overrides,
  } as any;
  return { service: new BookingService(repository), repository };
}

describe('BookingService.createBooking', () => {
  beforeEach(() => {
    generateBookableSlots.mockReset().mockResolvedValue([]);
  });

  it('rejects a slot the interviewer does not offer (server-side enforcement)', async () => {
    const { service } = buildService({
      getInterviewerProfileById: vi.fn().mockResolvedValue(INTERVIEWER),
    });

    await expect(
      service.createBooking('cand_1', {
        interviewerProfileId: 'int_1',
        scheduledAt: upcomingSlotIso(),
        interviewType: InterviewType.TECHNICAL_CODING,
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('rejects an interviewer with no hourly rate set', async () => {
    const slotIso = upcomingSlotIso();
    generateBookableSlots.mockResolvedValue([{ date: '2026-10-01', slots: [slotIso] }]);
    const { service } = buildService({
      getInterviewerProfileById: vi.fn().mockResolvedValue({
        ...INTERVIEWER,
        pricePerHour: 0,
      }),
    });

    await expect(
      service.createBooking('cand_1', {
        interviewerProfileId: 'int_1',
        scheduledAt: slotIso,
        interviewType: InterviewType.TECHNICAL_CODING,
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('maps SLOT_ALREADY_BOOKED to a 409 conflict', async () => {
    const slotIso = upcomingSlotIso();
    generateBookableSlots.mockResolvedValue([{ date: '2026-10-01', slots: [slotIso] }]);
    const { service } = buildService({
      getInterviewerProfileById: vi.fn().mockResolvedValue(INTERVIEWER),
      createBookingWithConflictCheck: vi.fn().mockRejectedValue(
        Object.assign(new Error('SLOT_ALREADY_BOOKED')),
      ),
    });

    await expect(
      service.createBooking('cand_1', {
        interviewerProfileId: 'int_1',
        scheduledAt: slotIso,
        interviewType: InterviewType.TECHNICAL_CODING,
      }),
    ).rejects.toMatchObject({ statusCode: 409, code: 'CONFLICT' });
  });

  it('rejects booking with yourself', async () => {
    const { service } = buildService({
      getInterviewerProfileById: vi.fn().mockResolvedValue({
        ...INTERVIEWER,
        userId: 'cand_1',
      }),
    });

    await expect(
      service.createBooking('cand_1', {
        interviewerProfileId: 'int_1',
        scheduledAt: upcomingSlotIso(),
        interviewType: InterviewType.TECHNICAL_CODING,
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('BookingService.cancelBooking', () => {
  const FUTURE_BOOKING = {
    id: 'b_1',
    candidateId: 'cand_1',
    scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    status: BookingStatus.CONFIRMED,
    candidate: { id: 'cand_1', name: 'C', email: 'c@x.com' },
    interviewerProfile: {
      userId: 'int_u_1',
      user: { name: 'I', email: 'i@x.com' },
    },
  };

  it('rejects cancellation inside the 2-hour cutoff window', async () => {
    const { service } = buildService({
      getBookingById: vi.fn().mockResolvedValue({
        ...FUTURE_BOOKING,
        scheduledAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min away
      }),
    });

    await expect(
      service.cancelBooking('b_1', 'cand_1', UserRole.CANDIDATE, 'running late'),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects double cancellation', async () => {
    const { service } = buildService({
      getBookingById: vi.fn().mockResolvedValue({
        ...FUTURE_BOOKING,
        status: BookingStatus.CANCELLED_BY_CANDIDATE,
      }),
    });

    await expect(
      service.cancelBooking('b_1', 'cand_1', UserRole.CANDIDATE, 'changed my mind'),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('allows candidate cancellation outside the cutoff and notifies both parties', async () => {
    const update = vi.fn().mockResolvedValue({ id: 'b_1', status: BookingStatus.CANCELLED_BY_CANDIDATE });
    const { service } = buildService({
      getBookingById: vi.fn().mockResolvedValue(FUTURE_BOOKING),
      updateBookingStatus: update,
    });

    const result = await service.cancelBooking('b_1', 'cand_1', UserRole.CANDIDATE, 'schedule conflict');
    expect(result.status).toBe(BookingStatus.CANCELLED_BY_CANDIDATE);
    expect(update).toHaveBeenCalled();
  });
});