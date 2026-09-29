// ============================================================
// feedback.repository.ts — Database Access for Feedback & Reviews
// ============================================================

import { prisma, isDbConnected } from '../../lib/prisma';
import { CreateFeedbackInput, CreateReviewInput } from './feedback.validator';
import { BookingStatus } from '@interviewiq/shared';

export class FeedbackRepository {
  /**
   * Feedback submission proves the session happened — transition the booking
   * to COMPLETED. Idempotent: re-submission keeps the terminal state.
   */
  async markBookingCompleted(bookingId: string) {
    if (!isDbConnected()) {
      return { id: bookingId, status: BookingStatus.COMPLETED } as any;
    }
    return prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.COMPLETED },
    });
  }

  async getBookingWithUsers(bookingId: string) {
    if (!isDbConnected()) {
      return {
        id: bookingId,
        candidateId: 'candidate_1',
        candidate: { id: 'candidate_1', name: 'Alex Johnson', email: 'alex@example.com' },
        interviewerProfileId: 'int_1',
        interviewerProfile: {
          id: 'int_1',
          userId: 'usr_int_1',
          user: { id: 'usr_int_1', name: 'Priya Sharma', email: 'priya@example.com' },
        },
        feedback: null,
        review: null,
      };
    }

    return prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        candidate: { select: { id: true, name: true, email: true } },
        interviewerProfile: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        feedback: true,
        review: true,
      },
    });
  }

  async createFeedback(
    interviewerProfileId: string,
    candidateId: string,
    input: CreateFeedbackInput,
  ) {
    if (!isDbConnected()) {
      return {
        id: `fb_${Date.now()}`,
        bookingId: input.bookingId,
        interviewerProfileId,
        candidateId,
        rawNotes: input.rawNotes,
        overallRating: input.overallRating,
        strengths: input.strengths,
        weaknesses: input.weaknesses,
        learningRecommendations: input.learningRecommendations,
        isSharedWithCandidate: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return prisma.$transaction(async (tx: any) => {
      // 1. Create or update Feedback record
      const feedback = await tx.feedback.upsert({
        where: { bookingId: input.bookingId },
        create: {
          bookingId: input.bookingId,
          interviewerProfileId,
          candidateId,
          rawNotes: input.rawNotes,
          overallRating: input.overallRating,
          strengths: input.strengths,
          weaknesses: input.weaknesses,
          learningRecommendations: input.learningRecommendations,
          isSharedWithCandidate: true,
        },
        update: {
          rawNotes: input.rawNotes,
          overallRating: input.overallRating,
          strengths: input.strengths,
          weaknesses: input.weaknesses,
          learningRecommendations: input.learningRecommendations,
          isSharedWithCandidate: true,
        },
      });

      // 2. Transition Booking status to COMPLETED
      await tx.booking.update({
        where: { id: input.bookingId },
        data: { status: BookingStatus.COMPLETED },
      });

      return feedback;
    });
  }

  async createReviewAndUpdateInterviewerStats(
    candidateId: string,
    interviewerProfileId: string,
    input: CreateReviewInput,
  ) {
    if (!isDbConnected()) {
      return {
        id: `rev_${Date.now()}`,
        bookingId: input.bookingId,
        candidateId,
        interviewerProfileId,
        rating: input.rating,
        comment: input.comment,
        createdAt: new Date(),
      };
    }

    return prisma.$transaction(async (tx: any) => {
      // 1. Create Review record
      const review = await tx.review.create({
        data: {
          bookingId: input.bookingId,
          candidateId,
          interviewerProfileId,
          rating: input.rating,
          comment: input.comment,
        },
      });

      // 2. Aggregate new average rating and total reviews count
      const aggregate = await tx.review.aggregate({
        where: { interviewerProfileId },
        _avg: { rating: true },
        _count: { id: true },
      });

      const newAvgRating = aggregate._avg.rating || 0;
      const totalReviews = aggregate._count.id;

      // 3. Update InterviewerProfile counters
      await tx.interviewerProfile.update({
        where: { id: interviewerProfileId },
        data: {
          averageRating: Math.round(newAvgRating * 10) / 10,
          totalReviews,
          totalInterviews: { increment: 1 },
        },
      });

      return review;
    });
  }

  async getFeedbackByBookingId(bookingId: string) {
    if (!isDbConnected()) {
      return {
        id: `fb_mock_1`,
        bookingId,
        interviewerProfileId: 'int_1',
        candidateId: 'candidate_1',
        overallRating: 4.8,
        rawNotes: 'Excellent problem solving skills. Solved dynamic programming problem with optimal O(N) space complexity.',
        strengths: ['Algorithms & Data Structures', 'Clean Modular Code', 'Clear Communication'],
        weaknesses: ['Corner case handling for empty inputs'],
        learningRecommendations: ['Practice graph algorithms and topological sort problems on LeetCode'],
        isSharedWithCandidate: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        booking: {
          id: bookingId,
          candidate: { id: 'candidate_1', name: 'Alex Johnson', avatar: null },
          interviewerProfile: {
            user: { id: 'usr_int_1', name: 'Priya Sharma', avatar: null },
          },
        },
      };
    }

    return prisma.feedback.findUnique({
      where: { bookingId },
      include: {
        booking: {
          include: {
            candidate: { select: { id: true, name: true, avatar: true } },
            interviewerProfile: {
              include: { user: { select: { id: true, name: true, avatar: true } } },
            },
          },
        },
      },
    });
  }
}

export const feedbackRepository = new FeedbackRepository();
