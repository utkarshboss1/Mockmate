// ============================================================
// reviews.service.ts — Reviews Business Logic Layer
// ============================================================

import { reviewsRepository, ReviewsRepository } from './reviews.repository';
import { CreateReviewInput } from './reviews.validator';
import { errors } from '../../middleware/error.middleware';

export class ReviewsService {
  constructor(private repository: ReviewsRepository) {}

  async createReview(candidateId: string, input: CreateReviewInput) {
    const booking = await this.repository.getBookingForReview(input.bookingId);
    if (!booking) {
      throw errors.notFound('Booking');
    }

    if (booking.candidateId !== candidateId) {
      throw errors.forbidden('You can only review your own interview sessions');
    }

    if (booking.review) {
      throw errors.conflict('You have already submitted a review for this interview');
    }

    return this.repository.createReview(candidateId, booking.interviewerProfileId, input);
  }
}

export const reviewsService = new ReviewsService(reviewsRepository);
