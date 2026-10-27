// ============================================================
// booking.service.ts — Booking Business Logic Layer
// ============================================================

import { bookingRepository, BookingRepository } from './booking.repository';
import { CreateBookingInput, GetBookingsQueryInput } from './booking.validator';
import { errors } from '../../middleware/error.middleware';
import { BookingStatus, UserRole } from '@interviewiq/shared';
import { buildPaginationMeta } from '../../types';
import { availabilityService } from '../availability/availability.service';
import { isMockStorage } from '../../mockStore/mode';

// Unpaid PENDING bookings hold their slot for this long before the scheduler expires them.
export const PAYMENT_TTL_MINUTES = 15;

export class BookingService {
  constructor(private repository: BookingRepository) {}

  async createBooking(candidateId: string, input: CreateBookingInput) {
    const interviewer = await this.repository.getInterviewerProfileById(input.interviewerProfileId);
    if (!interviewer) {
      throw errors.notFound('Interviewer profile');
    }

    if (interviewer.userId === candidateId) {
      throw errors.badRequest('You cannot book a mock interview with yourself');
    }

    // 1. Server-side availability enforcement — the frontend SlotPicker is a
    // convenience, never the source of truth. The requested slot must be one
    // this interviewer actually offers (weekly rules, minus booked/blocked).
    const bookable = await availabilityService.generateBookableSlots(
      input.interviewerProfileId,
      30,
    );
    const requestedIso = new Date(input.scheduledAt).toISOString();
    const isSlotOffered = bookable.some((day: any) => day.slots.includes(requestedIso));
    if (!isSlotOffered) {
      throw errors.conflict('The selected time slot is not available for this interviewer');
    }

    // 2. Calculate financials in paise (₹ INR minor units)
    const totalAmountPaise = interviewer.pricePerHour;
    if (!totalAmountPaise || totalAmountPaise <= 0) {
      throw errors.conflict('This interviewer has not set a valid hourly rate yet');
    }
    const platformFeePercent = 15;
    const platformFeePaise = Math.round((totalAmountPaise * platformFeePercent) / 100);
    const interviewerPayoutPaise = totalAmountPaise - platformFeePaise;

    // 3. Reservation deadline — the booking expires if unpaid past this.
    const paymentDueAt = new Date(Date.now() + PAYMENT_TTL_MINUTES * 60 * 1000);

    if (input.useCredit && !isMockStorage()) {
      const { prisma } = await import('../../lib/prisma');
      const candidate = await prisma.user.findUnique({
        where: { id: candidateId },
        select: { interviewCredits: true },
      });
      if (!candidate || candidate.interviewCredits < 1) {
        throw errors.badRequest('You do not have any mock interview credits remaining');
      }
    }

    try {
      return await this.repository.createBookingWithConflictCheck(
        candidateId,
        input,
        {
          totalAmountPaise,
          platformFeePaise,
          interviewerPayoutPaise,
          paymentDueAt,
        },
        {
          useCredit: input.useCredit,
        },
      );
    } catch (err: any) {
      // SLOT_ALREADY_BOOKED — our explicit conflict error.
      // P2034 — Prisma serialization failure from the concurrent-transaction guard.
      if (err.message === 'SLOT_ALREADY_BOOKED' || err?.code === 'P2034') {
        throw errors.conflict('This time slot has already been booked by another candidate');
      }
      throw err;
    }
  }

  async getCandidateBookings(candidateId: string, query: GetBookingsQueryInput) {
    const { total, items } = await this.repository.getCandidateBookings(candidateId, query);
    const meta = buildPaginationMeta(total, query.page, query.limit);
    return { items, meta };
  }

  async getInterviewerBookings(userId: string, query: GetBookingsQueryInput) {
    const profile = await this.repository.getInterviewerProfileByUserId(userId);
    if (!profile) {
      throw errors.notFound('Interviewer profile');
    }

    const { total, items } = await this.repository.getInterviewerBookings(profile.id, query);
    const meta = buildPaginationMeta(total, query.page, query.limit);
    return { items, meta };
  }

  async getBookingDetails(bookingId: string, userId: string, role: UserRole) {
    const booking = await this.repository.getBookingById(bookingId);
    if (!booking) {
      throw errors.notFound('Booking');
    }

    // Authorization check: User must be candidate, interviewer, or admin
    const isCandidate = booking.candidateId === userId;
    const isInterviewer = booking.interviewerProfile.userId === userId;
    const isAdmin = role === UserRole.ADMIN;

    if (!isCandidate && !isInterviewer && !isAdmin) {
      throw errors.forbidden('You do not have permission to view this booking');
    }

    return booking;
  }

  async cancelBooking(bookingId: string, userId: string, role: UserRole, reason: string) {
    const booking = await this.repository.getBookingById(bookingId);
    if (!booking) {
      throw errors.notFound('Booking');
    }

    const isCandidate =
      booking.candidateId === userId ||
      (isMockStorage() && booking.candidateId === 'candidate_1' && role === UserRole.CANDIDATE);
    const isInterviewer =
      booking.interviewerProfile.userId === userId ||
      (isMockStorage() && booking.interviewerProfile.userId === 'u_1' && role === UserRole.INTERVIEWER);
    const isAdmin = role === UserRole.ADMIN;

    if (!isCandidate && !isInterviewer && !isAdmin) {
      throw errors.forbidden('You do not have permission to cancel this booking');
    }

    if (
      booking.status === BookingStatus.COMPLETED ||
      booking.status === BookingStatus.EXPIRED
    ) {
      throw errors.badRequest('This booking can no longer be cancelled');
    }

    if (booking.status === BookingStatus.CANCELLED_BY_CANDIDATE ||
        booking.status === BookingStatus.CANCELLED_BY_INTERVIEWER) {
      throw errors.badRequest('This booking has already been cancelled');
    }

    // Cancellation cutoff — no cancelling inside the final 2 hours before start.
    const msUntilStart = new Date(booking.scheduledAt).getTime() - Date.now();
    const CANCELLATION_CUTOFF_MS = 2 * 60 * 60 * 1000;
    if (msUntilStart < CANCELLATION_CUTOFF_MS) {
      throw errors.badRequest('Sessions cannot be cancelled less than 2 hours before the scheduled start time');
    }

    const newStatus = isCandidate
      ? BookingStatus.CANCELLED_BY_CANDIDATE
      : BookingStatus.CANCELLED_BY_INTERVIEWER;
    const cancelledBy = isAdmin && !isCandidate && !isInterviewer ? 'admin' : isCandidate ? 'candidate' : 'interviewer';
    const cancellationNote = `Cancelled by ${cancelledBy}: ${reason}`;

    const cancelled = await this.repository.updateBookingStatus(bookingId, newStatus, cancellationNote);

    // Cancellation notification (in-app + email, non-blocking)
    const { notificationService } = await import('../notification/notification.service');
    void notificationService.notifyBookingCancelled({
      candidateId: booking.candidateId,
      candidateEmail: booking.candidate.email,
      candidateName: booking.candidate.name,
      interviewerUserId: booking.interviewerProfile.userId,
      interviewerEmail: booking.interviewerProfile.user.email,
      interviewerName: booking.interviewerProfile.user.name,
      cancelledBy,
      scheduledAt: new Date(booking.scheduledAt).toISOString(),
      bookingId: booking.id,
    });

    return cancelled;
  }
}

export const bookingService = new BookingService(bookingRepository);
