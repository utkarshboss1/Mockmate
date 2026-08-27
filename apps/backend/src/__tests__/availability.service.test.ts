// ============================================================
// availability.service.test.ts — Unit Tests for Slot Generator
//
// Exercises the REAL AvailabilityService.generateBookableSlots
// logic with a mocked repository.
// ============================================================

import { describe, it, expect, vi } from 'vitest';
import { DayOfWeek } from '@interviewiq/shared';
import { AvailabilityService } from '../modules/availability/availability.service';
import { AvailabilityRepository } from '../modules/availability/availability.repository';

const DAY_MAP: Record<number, DayOfWeek> = {
  0: DayOfWeek.SUNDAY,
  1: DayOfWeek.MONDAY,
  2: DayOfWeek.TUESDAY,
  3: DayOfWeek.WEDNESDAY,
  4: DayOfWeek.THURSDAY,
  5: DayOfWeek.FRIDAY,
  6: DayOfWeek.SATURDAY,
};

/** Next UTC-midnight date at least `minDaysAhead` days out on the given weekday */
function upcomingDateOn(dayIndex: number, minDaysAhead = 2): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + minDaysAhead);
  while (d.getUTCDay() !== dayIndex) {
    d.setUTCDate(d.getUTCDate() + 1);
  }
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function buildService(overrides: Partial<AvailabilityRepository> = {}) {
  const repository = {
    getSlotsByInterviewerProfileId: vi.fn().mockResolvedValue([]),
    getExistingBookingsInRange: vi.fn().mockResolvedValue([]),
    getBlockedSlotsInRange: vi.fn().mockResolvedValue([]),
    ...overrides,
  } as unknown as AvailabilityRepository;
  return new AvailabilityService(repository);
}

describe('AvailabilityService.generateBookableSlots', () => {
  it('generates discrete 60-minute slots within an active weekly window', async () => {
    // Wednesday is arbitrary but stable across runs thanks to upcomingDateOn
    const date = upcomingDateOn(3);
    const service = buildService({
      getSlotsByInterviewerProfileId: vi.fn().mockResolvedValue([
        { dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '09:00', endTime: '12:00', isActive: true },
      ]),
    });

    const result = await service.generateBookableSlots('int_1', 14);

    const dayEntry = result.find((d) => d.date === date.toISOString().split('T')[0]);
    expect(dayEntry).toBeDefined();
    // 09:00–10:00, 10:00–11:00, 11:00–12:00
    expect(dayEntry!.slots).toHaveLength(3);
    expect(dayEntry!.slots[0]).toBe(new Date(`${date.toISOString().split('T')[0]}T09:00:00.000Z`).toISOString());
  });

  it('excludes inactive weekly rules', async () => {
    const date = upcomingDateOn(3);
    const service = buildService({
      getSlotsByInterviewerProfileId: vi.fn().mockResolvedValue([
        { dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '09:00', endTime: '12:00', isActive: false },
      ]),
    });

    const result = await service.generateBookableSlots('int_1', 14);
    expect(result.find((d) => d.date === date.toISOString().split('T')[0])).toBeUndefined();
  });

  it('excludes slots already booked at the exact start timestamp', async () => {
    const date = upcomingDateOn(3);
    const bookedStart = new Date(`${date.toISOString().split('T')[0]}T09:00:00.000Z`);

    const service = buildService({
      getSlotsByInterviewerProfileId: vi.fn().mockResolvedValue([
        { dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '09:00', endTime: '11:00', isActive: true },
      ]),
      getExistingBookingsInRange: vi.fn().mockResolvedValue([{ scheduledAt: bookedStart }]),
    });

    const result = await service.generateBookableSlots('int_1', 14);
    const dayEntry = result.find((d) => d.date === date.toISOString().split('T')[0]);

    expect(dayEntry!.slots).toHaveLength(1); // only 10:00 remains
    expect(dayEntry!.slots[0]).toContain('T10:00:00');
  });

  it('excludes slots overlapping a blocked range', async () => {
    const date = upcomingDateOn(3);
    const dateStr = date.toISOString().split('T')[0];

    const service = buildService({
      getSlotsByInterviewerProfileId: vi.fn().mockResolvedValue([
        { dayOfWeek: DAY_MAP[date.getUTCDay()], startTime: '09:00', endTime: '11:00', isActive: true },
      ]),
      getBlockedSlotsInRange: vi.fn().mockResolvedValue([
        // Blocks 09:30–10:30 → kills both the 09:00 and 10:00 slots
        {
          startDateTime: new Date(`${dateStr}T09:30:00.000Z`),
          endDateTime: new Date(`${dateStr}T10:30:00.000Z`),
        },
      ]),
    });

    const result = await service.generateBookableSlots('int_1', 14);
    expect(result.find((d) => d.date === dateStr)).toBeUndefined();
  });
});

describe('Booking financials arithmetic', () => {
  it('calculates platform fee accurately in paise (INR)', () => {
    const totalAmountPaise = 80000; // ₹800.00
    const platformFeePercent = 15;

    const platformFeePaise = Math.round((totalAmountPaise * platformFeePercent) / 100);
    const interviewerPayoutPaise = totalAmountPaise - platformFeePaise;

    expect(platformFeePaise).toBe(12000); // ₹120.00
    expect(interviewerPayoutPaise).toBe(68000); // ₹680.00
    expect(platformFeePaise + interviewerPayoutPaise).toBe(totalAmountPaise);
  });
});
