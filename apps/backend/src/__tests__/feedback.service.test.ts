import { describe, expect, it, vi } from 'vitest';
import { BookingStatus, InterviewStatus, OverallRating } from '@interviewiq/shared';
import { FeedbackRepository } from '../modules/feedback/feedback.repository';
import { FeedbackService } from '../modules/feedback/feedback.service';

function buildService(booking: Record<string, unknown>) {
  const repository = {
    getBookingWithUsers: vi.fn().mockResolvedValue(booking),
    createFeedback: vi.fn(),
    markBookingCompleted: vi.fn(),
    createReviewAndUpdateInterviewerStats: vi.fn(),
  } as unknown as FeedbackRepository;

  return { service: new FeedbackService(repository), repository };
}

const booking = (status: BookingStatus, interviewStatus: InterviewStatus) => ({
  id: 'booking-1',
  candidateId: 'candidate-1',
  interviewerProfileId: 'interviewer-profile-1',
  interviewerProfile: {
    userId: 'interviewer-user-1',
    user: { id: 'interviewer-user-1', name: 'Interviewer', email: 'interviewer@example.com' },
  },
  candidate: { name: 'Candidate', email: 'candidate@example.com' },
  status,
  interview: { status: interviewStatus },
  review: null,
});

describe('FeedbackService session eligibility', () => {
  it('rejects feedback until the interview has ended', async () => {
    const { service, repository } = buildService(
      booking(BookingStatus.CONFIRMED, InterviewStatus.ACTIVE),
    );

    await expect(
      service.submitFeedback('interviewer-user-1', {
        bookingId: 'booking-1',
        rawNotes: 'The candidate explained the approach clearly.',
        overallRating: OverallRating.HIRE,
        strengths: [],
        weaknesses: [],
        learningRecommendations: [],
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(repository.createFeedback).not.toHaveBeenCalled();
  });

  it('rejects reviews unless the booking and interview are completed', async () => {
    const { service, repository } = buildService(
      booking(BookingStatus.CONFIRMED, InterviewStatus.ENDED),
    );

    await expect(
      service.submitReview('candidate-1', {
        bookingId: 'booking-1',
        rating: 5,
        comment: 'Great session',
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(repository.createReviewAndUpdateInterviewerStats).not.toHaveBeenCalled();
  });
});
