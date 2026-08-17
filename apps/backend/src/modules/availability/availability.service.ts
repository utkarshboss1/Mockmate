// ============================================================
// availability.service.ts — Slot Generator & Business Logic
// ============================================================

import { availabilityRepository, AvailabilityRepository } from './availability.repository';
import { UpdateAvailabilityInput, CreateBlockedSlotInput } from './availability.validator';
import { errors } from '../../middleware/error.middleware';
import { DayOfWeek } from '@interviewiq/shared';

const DAY_MAP: Record<number, DayOfWeek> = {
  0: DayOfWeek.SUNDAY,
  1: DayOfWeek.MONDAY,
  2: DayOfWeek.TUESDAY,
  3: DayOfWeek.WEDNESDAY,
  4: DayOfWeek.THURSDAY,
  5: DayOfWeek.FRIDAY,
  6: DayOfWeek.SATURDAY,
};

export class AvailabilityService {
  constructor(private repository: AvailabilityRepository) {}

  async getMyWeeklySlots(userId: string) {
    const profileId = await this.repository.getInterviewerProfileId(userId);
    if (!profileId) {
      throw errors.notFound('Interviewer profile');
    }
    return this.repository.getSlotsByInterviewerProfileId(profileId);
  }

  async updateMyWeeklySlots(userId: string, input: UpdateAvailabilityInput) {
    const profileId = await this.repository.getInterviewerProfileId(userId);
    if (!profileId) {
      throw errors.notFound('Interviewer profile');
    }
    return this.repository.replaceWeeklySlots(profileId, input);
  }

  async getMyBlockedSlots(userId: string) {
    const profileId = await this.repository.getInterviewerProfileId(userId);
    if (!profileId) {
      throw errors.notFound('Interviewer profile');
    }
    return this.repository.getBlockedSlots(profileId);
  }

  async createMyBlockedSlot(userId: string, input: CreateBlockedSlotInput) {
    const profileId = await this.repository.getInterviewerProfileId(userId);
    if (!profileId) {
      throw errors.notFound('Interviewer profile');
    }
    return this.repository.createBlockedSlot(
      profileId,
      new Date(input.startDateTime),
      new Date(input.endDateTime),
      input.reason,
    );
  }

  async deleteMyBlockedSlot(userId: string, blockedSlotId: string) {
    const profileId = await this.repository.getInterviewerProfileId(userId);
    if (!profileId) {
      throw errors.notFound('Interviewer profile');
    }
    return this.repository.deleteBlockedSlot(profileId, blockedSlotId);
  }

  async generateBookableSlots(interviewerProfileId: string, daysLookahead = 14) {
    const activeRules = await this.repository.getSlotsByInterviewerProfileId(interviewerProfileId);
    const activeSlots = activeRules.filter((r: any) => r.isActive);

    if (activeSlots.length === 0) {
      return [];
    }

    const now = new Date();
    const endDate = new Date(now.getTime() + daysLookahead * 24 * 60 * 60 * 1000);

    const [existingBookings, blockedSlots] = await Promise.all([
      this.repository.getExistingBookingsInRange(interviewerProfileId, now, endDate),
      this.repository.getBlockedSlotsInRange(interviewerProfileId, now, endDate),
    ]);

    const bookedTimeStamps = new Set(
      existingBookings.map((b) => b.scheduledAt.getTime()),
    );

    const bookableDatesMap: Record<string, string[]> = {};

    // Loop through each date in range
    const currentDate = new Date(now);
    currentDate.setUTCHours(0, 0, 0, 0);

    while (currentDate <= endDate) {
      const dayOfWeekEnum = DAY_MAP[currentDate.getUTCDay()];
      const matchingRules = activeSlots.filter((r: any) => r.dayOfWeek === dayOfWeekEnum);

      for (const rule of matchingRules) {
        const [startH, startM] = rule.startTime.split(':').map(Number);
        const [endH, endM] = rule.endTime.split(':').map(Number);

        let slotTime = new Date(currentDate);
        slotTime.setUTCHours(startH, startM, 0, 0);

        const ruleEndTime = new Date(currentDate);
        ruleEndTime.setUTCHours(endH, endM, 0, 0);

        // Generate 60-min intervals
        while (slotTime.getTime() + 60 * 60 * 1000 <= ruleEndTime.getTime()) {
          const timestamp = slotTime.getTime();
          const slotEndTime = timestamp + 60 * 60 * 1000;

          // Check if slot falls within any blocked range
          const isBlocked = blockedSlots.some((blk) => {
            const blkStart = new Date(blk.startDateTime).getTime();
            const blkEnd = new Date(blk.endDateTime).getTime();
            return timestamp < blkEnd && slotEndTime > blkStart;
          });

          // Must be in future, not booked, and not blocked
          if (timestamp > now.getTime() && !bookedTimeStamps.has(timestamp) && !isBlocked) {
            const dateStr = slotTime.toISOString().split('T')[0]; // "YYYY-MM-DD"
            const isoString = slotTime.toISOString();

            if (!bookableDatesMap[dateStr]) {
              bookableDatesMap[dateStr] = [];
            }
            bookableDatesMap[dateStr].push(isoString);
          }

          slotTime = new Date(slotTime.getTime() + 60 * 60 * 1000);
        }
      }

      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    // Convert map to structured array
    return Object.entries(bookableDatesMap).map(([date, times]) => ({
      date,
      slots: times,
    }));
  }
}

export const availabilityService = new AvailabilityService(availabilityRepository);
