// ============================================================
// interview.service.ts — Interview Room & LiveKit Business Logic
// ============================================================

import { interviewRepository, InterviewRepository } from './interview.repository';
import { generateLiveKitToken } from '../../lib/livekit';
import { errors } from '../../middleware/error.middleware';
import { InterviewStatus } from '@interviewiq/shared';
import { isDbConnected } from '../../lib/prisma';

export class InterviewService {
  constructor(private repository: InterviewRepository) {}

  private assertParticipant(
    interview: { booking: { candidateId: string; interviewerProfile: { userId: string } } },
    userId: string,
    action = 'access',
  ): void {
    const isCandidate = interview.booking.candidateId === userId;
    const isInterviewer = interview.booking.interviewerProfile.userId === userId;

    if (!isCandidate && !isInterviewer) {
      throw errors.forbidden(`You are not authorized to ${action} this interview`);
    }
  }

  async getInterviewToken(interviewId: string, userId: string, userName: string) {
    const interview = await this.repository.getInterviewById(interviewId);
    if (!interview) {
      throw errors.notFound('Interview room');
    }

    const isCandidate = interview.booking.candidateId === userId;
    const isInterviewer = interview.booking.interviewerProfile.userId === userId;

    if (!isCandidate && !isInterviewer) {
      throw errors.forbidden('You are not authorized to join this interview room');
    }

    // Generate LiveKit JWT token
    const token = await generateLiveKitToken({
      roomName: interview.roomName,
      identity: userId,
      name: userName,
    });

    // If status is WAITING, mark as ACTIVE
    if (interview.status === InterviewStatus.WAITING) {
      await this.repository.updateInterviewStatus(interviewId, InterviewStatus.ACTIVE, 'startedAt');
    }

    return {
      token,
      roomName: interview.roomName,
      interview: {
        id: interview.id,
        status: interview.status,
        booking: {
          id: interview.booking.id,
          interviewType: interview.booking.interviewType,
          candidate: interview.booking.candidate,
          interviewer: interview.booking.interviewerProfile.user,
        },
      },
    };
  }

  async getInterviewDetails(interviewId: string, userId: string) {
    const interview = await this.repository.getInterviewById(interviewId);
    if (!interview) {
      throw errors.notFound('Interview room');
    }

    const isCandidate = interview.booking.candidateId === userId;
    const isInterviewer = interview.booking.interviewerProfile.userId === userId;

    if (!isCandidate && !isInterviewer) {
      throw errors.forbidden('You are not authorized to view this interview room');
    }

    return interview;
  }

  async endInterview(interviewId: string, userId: string) {
    const interview = await this.repository.getInterviewById(interviewId);
    if (!interview) {
      throw errors.notFound('Interview room');
    }

    const isInterviewer = interview.booking.interviewerProfile.userId === userId;
    const isCandidate = interview.booking.candidateId === userId;
    const canEnd = isInterviewer || isCandidate;

    if (!canEnd) {
      throw errors.forbidden('You are not authorized to conclude this interview session');
    }

    return this.repository.updateInterviewStatus(interviewId, InterviewStatus.ENDED, 'endedAt');
  }

  async getInterviewMessages(interviewId: string, userId: string) {
    const interview = await this.repository.getInterviewById(interviewId);
    if (!interview) {
      throw errors.notFound('Interview room');
    }

    this.assertParticipant(
      interview,
      userId,
      'view messages for',
    );

    return this.repository.getMessagesByInterviewId(interviewId);
  }

  async saveCodeSnapshot(
    interviewId: string,
    userId: string,
    content: string,
    language?: string,
  ) {
    if (typeof content !== 'string' || content.length === 0) {
      throw errors.badRequest('Snapshot content is required and must be a non-empty string');
    }
    if (content.length > 500_000) {
      throw errors.badRequest('Snapshot content exceeds the maximum allowed size');
    }

    const interview = await this.repository.getInterviewById(interviewId);
    if (!interview) {
      throw errors.notFound('Interview room');
    }

    this.assertParticipant(interview, userId, 'save a snapshot for');

    return this.repository.upsertCodeSnapshot(interviewId, content, language);
  }
}

export const interviewService = new InterviewService(interviewRepository);
