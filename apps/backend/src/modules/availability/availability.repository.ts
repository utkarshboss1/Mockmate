// ============================================================
// availability.repository.ts — Database Access for Availability
// ============================================================

import { prisma } from '../../lib/prisma';
import { UpdateAvailabilityInput } from './availability.validator';
import { BookingStatus } from '@interviewiq/shared';

export class AvailabilityRepository {
  async getInterviewerProfileId(userId: string) {
    const profile = await prisma.interviewerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    return profile?.id || null;
  }

  async getSlotsByInterviewerProfileId(interviewerProfileId: string) {
    return prisma.availabilitySlot.findMany({
      where: { interviewerProfileId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async replaceWeeklySlots(interviewerProfileId: string, input: UpdateAvailabilityInput) {
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
    return prisma.blockedSlot.deleteMany({
      where: {
        id: blockedSlotId,
        interviewerProfileId,
      },
    });
  }

  async getBlockedSlotsInRange(interviewerProfileId: string, startDateTime: Date, endDateTime: Date) {
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
