// ============================================================
// reviews.repository.ts — Reviews Database Access Layer
// ============================================================

import { prisma, isDbConnected } from '../../lib/prisma';
import { CreateReviewInput } from './reviews.validator';

export class ReviewsRepository {
  async getBookingForReview(bookingId: string) {
    if (!isDbConnected()) {
      return {
        id: bookingId,
        candidateId: 'candidate_1',
        interviewerProfileId: 'int_1',
        status: 'COMPLETED',
        review: null,
      } as any;
    }

    return prisma.booking.findUnique({
      where: { id: bookingId },
      include: { review: true },
    });
  }

  async createReview(candidateId: string, interviewerProfileId: string, input: CreateReviewInput) {
    if (!isDbConnected()) {
      return {
        id: 'rev_1',
        bookingId: input.bookingId,
        interviewerProfileId,
        rating: input.rating,
        comment: input.comment || null,
        createdAt: new Date(),
      } as any;
    }

    return prisma.$transaction(async (tx: any) => {
      // 1. Create Review
      const review = await tx.review.create({
        data: {
          bookingId: input.bookingId,
          candidateId,
          interviewerProfileId,
          rating: input.rating,
          comment: input.comment || null,
        },
      });

      // 2. Recalculate Interviewer Rating
      const stats = await tx.review.aggregate({
        where: { interviewerProfileId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.interviewerProfile.update({
        where: { id: interviewerProfileId },
        data: {
          averageRating: stats._avg.rating || input.rating,
          totalReviews: stats._count.rating,
        },
      });

      return review;
    });
  }
}

export const reviewsRepository = new ReviewsRepository();
