// ============================================================
// users.repository.ts — Users & Profiles DB Operations
// ============================================================

import { prisma, isDbConnected } from '../../lib/prisma';
import { UpdateCandidateProfileInput, UpdateInterviewerProfileInput } from './users.validator';

export class UsersRepository {
  async getUserById(id: string) {
    if (!isDbConnected()) {
      let role = 'CANDIDATE';
      if (id.includes('interviewer')) role = 'INTERVIEWER';
      else if (id.includes('admin')) role = 'ADMIN';

      return {
        id,
        name: `Mock ${role.charAt(0) + role.slice(1).toLowerCase()}`,
        email: `${role.toLowerCase()}@mock.com`,
        role,
        status: 'ACTIVE',
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        interviewerProfile: null,
      } as any;
    }

    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        status: true,
        activePlan: true,
        planExpiresAt: true,
        interviewCredits: true,
        createdAt: true,
        updatedAt: true,
        interviewerProfile: {
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
          },
        },
      },
    });
  }

  async updateCandidateProfile(userId: string, input: UpdateCandidateProfileInput) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name,
        ...(input.avatar !== undefined && { avatar: input.avatar }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        status: true,
      },
    });
  }

  async updateInterviewerProfile(userId: string, input: UpdateInterviewerProfileInput) {
    const pricePerHourPaise = Math.round(input.pricePerHourRupees * 100);

    return prisma.$transaction(async (tx: any) => {
      // 1. Upsert InterviewerProfile
      const profile = await tx.interviewerProfile.upsert({
        where: { userId },
        create: {
          userId,
          headline: input.headline,
          bio: input.bio,
          company: input.company || null,
          jobTitle: input.jobTitle || null,
          yearsOfExperience: input.yearsOfExperience,
          experienceLevel: input.experienceLevel,
          pricePerHour: pricePerHourPaise,
          linkedinUrl: input.linkedinUrl || null,
          githubUrl: input.githubUrl || null,
        },
        update: {
          headline: input.headline,
          bio: input.bio,
          company: input.company || null,
          jobTitle: input.jobTitle || null,
          yearsOfExperience: input.yearsOfExperience,
          experienceLevel: input.experienceLevel,
          pricePerHour: pricePerHourPaise,
          linkedinUrl: input.linkedinUrl || null,
          githubUrl: input.githubUrl || null,
        },
      });

      // 2. Clear existing tags and re-attach new tags
      await tx.interviewerTag.deleteMany({
        where: { interviewerProfileId: profile.id },
      });

      if (input.tags.length > 0) {
        // Ensure tags exist in Tag table
        for (const tagName of input.tags) {
          const slug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          const tagRecord = await tx.tag.upsert({
            where: { slug },
            create: { name: tagName, slug },
            update: {},
          });

          await tx.interviewerTag.create({
            data: {
              interviewerProfileId: profile.id,
              tagId: tagRecord.id,
            },
          });
        }
      }

      return tx.interviewerProfile.findUnique({
        where: { id: profile.id },
        include: {
          tags: {
            include: { tag: true },
          },
          user: {
            select: { id: true, name: true, avatar: true, email: true },
          },
        },
      });
    });
  }

  async getAllTags() {
    return prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });
  }
}

export const usersRepository = new UsersRepository();
