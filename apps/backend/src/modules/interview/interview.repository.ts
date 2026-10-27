// ============================================================
// interview.repository.ts — Database Access for Interviews
// ============================================================

import { prisma } from '../../lib/prisma';
import { InterviewStatus } from '@interviewiq/shared';

export class InterviewRepository {
  async getInterviewById(id: string) {
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
    return prisma.interview.findUnique({
      where: { bookingId },
    });
  }

  async updateInterviewStatus(id: string, status: InterviewStatus, timestampField?: 'startedAt' | 'endedAt') {
    const data: any = { status };
    if (timestampField === 'startedAt') data.startedAt = new Date();
    if (timestampField === 'endedAt') data.endedAt = new Date();

    return prisma.interview.update({
      where: { id },
      data,
    });
  }

  async getMessagesByInterviewId(interviewId: string) {
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
    return prisma.codeSnapshot.upsert({
      where: { interviewId },
      create: { interviewId, content, language: language || 'javascript' },
      update: { content, language: language || 'javascript' },
    });
  }
}

export const interviewRepository = new InterviewRepository();
