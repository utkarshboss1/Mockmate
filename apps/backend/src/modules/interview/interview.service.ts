// ============================================================
// interview.service.ts — Interview Room & LiveKit Business Logic
// ============================================================

import { interviewRepository, InterviewRepository } from './interview.repository';
import { generateLiveKitToken } from '../../lib/livekit';
import { errors } from '../../middleware/error.middleware';
import { InterviewStatus, UserRole } from '@interviewiq/shared';
import { isDbConnected } from '../../lib/prisma';

export class InterviewService {
  constructor(private repository: InterviewRepository) {}

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
    const canEnd = isInterviewer || (isCandidate && !isDbConnected());

    if (!canEnd) {
      throw errors.forbidden('Only the interviewer can conclude the interview session');
    }

    return this.repository.updateInterviewStatus(interviewId, InterviewStatus.ENDED, 'endedAt');
  }
}

export const interviewService = new InterviewService(interviewRepository);
