// ============================================================
// booking.service.ts — Booking Business Logic Layer
// ============================================================

import { bookingRepository, BookingRepository } from './booking.repository';
import { CreateBookingInput, GetBookingsQueryInput } from './booking.validator';
import { errors } from '../../middleware/error.middleware';
import { BookingStatus, UserRole } from '@interviewiq/shared';
import { buildPaginationMeta } from '../../types';

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

    // 1. Calculate financials in paise / ₹ (INR)
    const totalAmountCents = interviewer.pricePerHour;
    const platformFeePercent = 15;
    const platformFeeCents = Math.round((totalAmountCents * platformFeePercent) / 100);
    const interviewerPayoutCents = totalAmountCents - platformFeeCents;

    try {
      return await this.repository.createBookingWithConflictCheck(candidateId, input, {
        totalAmountCents,
        platformFeeCents,
        interviewerPayoutCents,
      });
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

    const isCandidate = booking.candidateId === userId;
    const isInterviewer = booking.interviewerProfile.userId === userId;
    const isAdmin = role === UserRole.ADMIN;

    if (!isCandidate && !isInterviewer && !isAdmin) {
      throw errors.forbidden('You do not have permission to cancel this booking');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw errors.badRequest('Completed interviews cannot be cancelled');
    }

    const cancelledBy = isCandidate ? 'candidate' : 'interviewer';
    const newStatus = isCandidate
      ? BookingStatus.CANCELLED_BY_CANDIDATE
      : BookingStatus.CANCELLED_BY_INTERVIEWER;

    const cancellationNote = `Cancelled by ${isAdmin && !isCandidate && !isInterviewer ? 'admin' : cancelledBy}: ${reason}`;

    return this.repository.updateBookingStatus(bookingId, newStatus, cancellationNote);
  }
}

export const bookingService = new BookingService(bookingRepository);
