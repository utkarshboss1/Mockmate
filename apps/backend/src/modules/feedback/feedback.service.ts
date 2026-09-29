// ============================================================
// feedback.service.ts — Feedback & Review Business Logic Layer
// ============================================================

import { feedbackRepository, FeedbackRepository } from './feedback.repository';
import { CreateFeedbackInput, CreateReviewInput } from './feedback.validator';
import { errors } from '../../middleware/error.middleware';
import { UserRole } from '@interviewiq/shared';

export class FeedbackService {
  constructor(private repository: FeedbackRepository) {}

  async submitFeedback(userId: string, input: CreateFeedbackInput) {
    const booking = await this.repository.getBookingWithUsers(input.bookingId);
    if (!booking) {
      throw errors.notFound('Booking');
    }

    const isInterviewer = booking.interviewerProfile.user.id === userId;
    if (!isInterviewer) {
      throw errors.forbidden('Only the assigned interviewer can submit feedback for this session');
    }

    const feedback = await this.repository.createFeedback(
      booking.interviewerProfileId,
      booking.candidateId,
      input,
    );

    // Transition the booking to COMPLETED — feedback submission proves the
    // session happened. (The lifecycle scheduler also completes elapsed
    // sessions; both paths are idempotent.)
    await this.repository.markBookingCompleted(input.bookingId);

    // Trigger Notification & Email
    const { notificationService } = await import('../notification/notification.service');
    void notificationService.notifyFeedbackSubmitted({
      candidateId: booking.candidateId,
      candidateEmail: booking.candidate.email,
      interviewerName: booking.interviewerProfile.user.name,
      bookingId: input.bookingId,
    });

    return feedback;
  }

  async submitReview(candidateId: string, input: CreateReviewInput) {
    const booking = await this.repository.getBookingWithUsers(input.bookingId);
    if (!booking) {
      throw errors.notFound('Booking');
    }

    if (booking.candidateId !== candidateId) {
      throw errors.forbidden('Only the candidate who completed this session can leave a review');
    }

    if (booking.review) {
      throw errors.conflict('You have already submitted a review for this mock interview session');
    }

    const review = await this.repository.createReviewAndUpdateInterviewerStats(
      candidateId,
      booking.interviewerProfileId,
      input,
    );

    // Notify the interviewer about the new review (in-app + email, non-blocking)
    const { notificationService } = await import('../notification/notification.service');
    void notificationService.notifyReviewReceived({
      interviewerUserId: booking.interviewerProfile.userId,
      interviewerEmail: booking.interviewerProfile.user.email,
      interviewerName: booking.interviewerProfile.user.name,
      candidateName: booking.candidate.name,
      rating: input.rating,
      bookingId: input.bookingId,
    });

    return review;
  }

  async getFeedback(bookingId: string, userId: string, role: UserRole) {
    const booking = await this.repository.getBookingWithUsers(bookingId);
    if (!booking) {
      throw errors.notFound('Booking');
    }

    const isCandidate = booking.candidateId === userId;
    const isInterviewer = booking.interviewerProfile.user.id === userId;
    const isAdmin = role === UserRole.ADMIN;

    if (!isCandidate && !isInterviewer && !isAdmin) {
      throw errors.forbidden('You do not have permission to view feedback for this session');
    }

    const feedback = await this.repository.getFeedbackByBookingId(bookingId);
    if (!feedback) {
      throw errors.notFound('Feedback for this session has not been submitted yet');
    }

    return feedback;
  }
}

export const feedbackService = new FeedbackService(feedbackRepository);
