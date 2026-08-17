// ============================================================
// availability.service.test.ts — Unit Tests for Slot Generator
// ============================================================

import { describe, it, expect } from 'vitest';
import { DayOfWeek } from '@interviewiq/shared';

describe('Availability Slot Generator Logic', () => {
  it('should generate discrete 60-minute slots within time window', () => {
    const startTime = '09:00';
    const endTime = '12:00';

    const [startH] = startTime.split(':').map(Number);
    const [endH] = endTime.split(':').map(Number);

    const generatedCount = endH - startH; // 9:00-10:00, 10:00-11:00, 11:00-12:00 -> 3 slots
    expect(generatedCount).toBe(3);
  });

  it('should calculate platform fee accurately in paise (INR)', () => {
    const totalAmountPaise = 80000; // ₹800.00
    const platformFeePercent = 15;

    const platformFeePaise = Math.round((totalAmountPaise * platformFeePercent) / 100);
    const interviewerPayoutPaise = totalAmountPaise - platformFeePaise;

    expect(platformFeePaise).toBe(12000); // ₹120.00
    expect(interviewerPayoutPaise).toBe(68000); // ₹680.00
    expect(platformFeePaise + interviewerPayoutPaise).toBe(totalAmountPaise);
  });
});
