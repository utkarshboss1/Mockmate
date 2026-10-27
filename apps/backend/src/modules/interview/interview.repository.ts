// ============================================================
// interview.repository.ts — Database Access for Interviews
// ============================================================

import { prisma } from '../../lib/prisma';
import { isMockStorage } from '../../mockStore/mode';
import { InterviewStatus } from '@interviewiq/shared';

const SAMPLE_INTERVIEW = {
  id: 'i_1',
  bookingId: 'b_1',
  roomName: 'room_1',
  status: InterviewStatus.WAITING,
  booking: {
    id: 'b_1',
    candidateId: 'candidate_1',
    scheduledAt: new Date().toISOString(),
    interviewType: 'TECHNICAL_CODING',
    candidate: { id: 'candidate_1', name: 'Mock Candidate', email: 'candidate@mock.com', avatar: null },
    interviewerProfile: {
      userId: 'interviewer_1',
      user: { id: 'interviewer_1', name: 'Aarav Sharma', email: 'aarav@mock.com', avatar: null },
    },
  },
};

export class InterviewRepository {
  async getInterviewById(id: string) {
    if (isMockStorage()) {
      return { ...SAMPLE_INTERVIEW, id } as any;
    }

    return prisma.interview.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            candidate: { select: { id: true, name: true, email: true, avatar: true } },
            interviewerProfile: {
              include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
            },
          },
        },
      },
    });
  }

  async getInterviewByBookingId(bookingId: string) {
    if (isMockStorage()) {
      return { ...SAMPLE_INTERVIEW, bookingId } as any;
    }

    return prisma.interview.findUnique({
      where: { bookingId },
    });
  }

  async updateInterviewStatus(id: string, status: InterviewStatus, timestampField?: 'startedAt' | 'endedAt') {
    if (isMockStorage()) {
      return { ...SAMPLE_INTERVIEW, id, status } as any;
    }

    const data: any = { status };
    if (timestampField === 'startedAt') data.startedAt = new Date();
    if (timestampField === 'endedAt') data.endedAt = new Date();

    return prisma.interview.update({
      where: { id },
      data,
    });
  }

  async getMessagesByInterviewId(interviewId: string) {
    if (isMockStorage()) return [];

    return prisma.message.findMany({
      where: { interviewId },
      orderBy: { sentAt: 'asc' },
    });
  }

  async upsertCodeSnapshot(
    interviewId: string,
    content: string,
    language?: string,
  ) {
    if (isMockStorage()) {
      return { interviewId, content, language: language || 'javascript' } as any;
    }

    return prisma.codeSnapshot.upsert({
      where: { interviewId },
      create: { interviewId, content, language: language || 'javascript' },
      update: { content, language: language || 'javascript' },
    });
  }
}

export const interviewRepository = new InterviewRepository();
