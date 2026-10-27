// ============================================================
// availability.repository.ts — Database Access for Availability
// ============================================================

import { prisma } from '../../lib/prisma';
import { isMockStorage } from '../../mockStore/mode';
import { UpdateAvailabilityInput } from './availability.validator';
import { BookingStatus, DayOfWeek } from '@interviewiq/shared';

const SAMPLE_SLOTS = [
  { id: 's1', interviewerProfileId: 'int_1', dayOfWeek: DayOfWeek.MONDAY, startTime: '09:00', endTime: '17:00', isActive: true },
  { id: 's2', interviewerProfileId: 'int_1', dayOfWeek: DayOfWeek.TUESDAY, startTime: '09:00', endTime: '17:00', isActive: true },
  { id: 's3', interviewerProfileId: 'int_1', dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '09:00', endTime: '17:00', isActive: true },
  { id: 's4', interviewerProfileId: 'int_1', dayOfWeek: DayOfWeek.THURSDAY, startTime: '09:00', endTime: '17:00', isActive: true },
  { id: 's5', interviewerProfileId: 'int_1', dayOfWeek: DayOfWeek.FRIDAY, startTime: '09:00', endTime: '17:00', isActive: true },
];

export class AvailabilityRepository {
  async getInterviewerProfileId(userId: string) {
    if (isMockStorage()) {
      return 'int_1';
    }
    const profile = await prisma.interviewerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    return profile?.id || null;
  }

  async getSlotsByInterviewerProfileId(interviewerProfileId: string) {
    if (isMockStorage()) {
      return SAMPLE_SLOTS.map((slot) => ({ ...slot, interviewerProfileId })) as any;
    }
    return prisma.availabilitySlot.findMany({
      where: { interviewerProfileId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async replaceWeeklySlots(interviewerProfileId: string, input: UpdateAvailabilityInput) {
    if (isMockStorage()) {
      return SAMPLE_SLOTS.map((slot) => ({ ...slot, interviewerProfileId })) as any;
    }
    return prisma.$transaction(async (tx: any) => {
      await tx.availabilitySlot.deleteMany({
        where: { interviewerProfileId },
      });

      if (input.slots.length > 0) {
        await tx.availabilitySlot.createMany({
          data: input.slots.map((slot) => ({
            interviewerProfileId,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isActive: slot.isActive,
          })),
        });
      }

      return tx.availabilitySlot.findMany({
        where: { interviewerProfileId },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      });
    });
  }

  async getExistingBookingsInRange(interviewerProfileId: string, startDateTime: Date, endDateTime: Date) {
    if (isMockStorage()) {
      return [];
    }
    return prisma.booking.findMany({
      where: {
        interviewerProfileId,
        scheduledAt: {
          gte: startDateTime,
          lte: endDateTime,
        },
        status: {
          notIn: [BookingStatus.CANCELLED_BY_CANDIDATE, BookingStatus.CANCELLED_BY_INTERVIEWER],
        },
      },
      select: {
        scheduledAt: true,
        durationMinutes: true,
      },
    });
  }

  async getBlockedSlots(interviewerProfileId: string) {
    if (isMockStorage()) {
      return [];
    }
    return prisma.blockedSlot.findMany({
      where: { interviewerProfileId },
      orderBy: { startDateTime: 'asc' },
    });
  }

  async createBlockedSlot(
    interviewerProfileId: string,
    startDateTime: Date,
    endDateTime: Date,
    reason?: string,
  ) {
    if (isMockStorage()) {
      return {
        id: `blk_${Date.now()}`,
        interviewerProfileId,
        startDateTime,
        endDateTime,
        reason: reason || 'Personal / Blackout',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    return prisma.blockedSlot.create({
      data: {
        interviewerProfileId,
        startDateTime,
        endDateTime,
        reason,
      },
    });
  }

  async deleteBlockedSlot(interviewerProfileId: string, blockedSlotId: string) {
    if (isMockStorage()) {
      return { id: blockedSlotId };
    }
    return prisma.blockedSlot.deleteMany({
      where: {
        id: blockedSlotId,
        interviewerProfileId,
      },
    });
  }

  async getBlockedSlotsInRange(interviewerProfileId: string, startDateTime: Date, endDateTime: Date) {
    if (isMockStorage()) {
      return [];
    }
    return prisma.blockedSlot.findMany({
      where: {
        interviewerProfileId,
        startDateTime: { lte: endDateTime },
        endDateTime: { gte: startDateTime },
      },
    });
  }
}

export const availabilityRepository = new AvailabilityRepository();
