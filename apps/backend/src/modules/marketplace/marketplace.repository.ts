// ============================================================
// marketplace.repository.ts — Marketplace Database Access
// ============================================================

import { prisma, isDbConnected } from '../../lib/prisma';
import { MarketplaceQueryInput } from './marketplace.validator';
import { Prisma } from '@prisma/client';

// Sample mock data returned when database is connecting or unseeded
const SAMPLE_INTERVIEWERS = [
  {
    id: 'int_1',
    headline: 'Senior Staff Software Engineer @ Google',
    bio: 'Ex-Amazon, 10+ years interviewing candidates for System Design and Coding.',
    company: 'Google',
    jobTitle: 'Senior Staff Engineer',
    yearsOfExperience: 10,
    pricePerHour: 150000, // ₹1,500.00 in paise
    averageRating: 4.9,
    totalReviews: 42,
    totalInterviews: 128,
    user: {
      id: 'u_1',
      name: 'Aarav Sharma',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
    tags: [
      { tag: { id: 't1', name: 'System Design', slug: 'system-design' } },
      { tag: { id: 't2', name: 'Data Structures', slug: 'data-structures' } },
      { tag: { id: 't3', name: 'Python', slug: 'python' } },
    ],
  },
  {
    id: 'int_2',
    headline: 'Engineering Manager @ Microsoft',
    bio: 'Specialized in Distributed Systems, Microservices, and Behavioral STAR interviews.',
    company: 'Microsoft',
    jobTitle: 'Engineering Manager',
    yearsOfExperience: 12,
    pricePerHour: 200000, // ₹2,000.00 in paise
    averageRating: 5.0,
    totalReviews: 68,
    totalInterviews: 195,
    user: {
      id: 'u_2',
      name: 'Priya Patel',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    },
    tags: [
      { tag: { id: 't4', name: 'Distributed Systems', slug: 'distributed-systems' } },
      { tag: { id: 't5', name: 'Behavioral', slug: 'behavioral' } },
      { tag: { id: 't6', name: 'Java', slug: 'java' } },
    ],
  },
  {
    id: 'int_3',
    headline: 'Senior Backend Engineer @ Uber',
    bio: 'Passionate about helping engineers crack top tech company interviews with real feedback.',
    company: 'Uber',
    jobTitle: 'Senior Backend Engineer',
    yearsOfExperience: 7,
    pricePerHour: 120000, // ₹1,200.00 in paise
    averageRating: 4.8,
    totalReviews: 31,
    totalInterviews: 84,
    user: {
      id: 'u_3',
      name: 'Rohan Verma',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    },
    tags: [
      { tag: { id: 't7', name: 'Go', slug: 'go' } },
      { tag: { id: 't8', name: 'Kafka', slug: 'kafka' } },
      { tag: { id: 't9', name: 'PostgreSQL', slug: 'postgresql' } },
    ],
  },
];

export class MarketplaceRepository {
  async searchInterviewers(input: MarketplaceQueryInput) {
    const { search, experienceLevel, tags, minPriceRupees, maxPriceRupees, sort, page, limit } = input;

    if (!isDbConnected()) {
      return { total: SAMPLE_INTERVIEWERS.length, items: SAMPLE_INTERVIEWERS as any };
    }

    try {
      const where: any = {};

      if (search && search.trim()) {
        const query = search.trim();
        where.OR = [
          { headline: { contains: query, mode: 'insensitive' } },
          { bio: { contains: query, mode: 'insensitive' } },
          { company: { contains: query, mode: 'insensitive' } },
          { jobTitle: { contains: query, mode: 'insensitive' } },
          { user: { name: { contains: query, mode: 'insensitive' } } },
        ];
      }

      if (experienceLevel) {
        where.experienceLevel = experienceLevel;
      }

      if (minPriceRupees !== undefined || maxPriceRupees !== undefined) {
        where.pricePerHour = {};
        if (minPriceRupees !== undefined) {
          where.pricePerHour.gte = Math.round(minPriceRupees * 100);
        }
        if (maxPriceRupees !== undefined) {
          where.pricePerHour.lte = Math.round(maxPriceRupees * 100);
        }
      }

      if (tags && tags.trim()) {
        const tagList = tags.split(',').map((t) => t.trim().toLowerCase());
        where.tags = {
          some: {
            tag: {
              slug: { in: tagList },
            },
          },
        };
      }

      let orderBy: any = { averageRating: 'desc' };

      switch (sort) {
        case 'price_asc':
          orderBy = { pricePerHour: 'asc' };
          break;
        case 'price_desc':
          orderBy = { pricePerHour: 'desc' };
          break;
        case 'experience_desc':
          orderBy = { yearsOfExperience: 'desc' };
          break;
        case 'rating_desc':
        default:
          orderBy = { averageRating: 'desc' };
          break;
      }

      const skip = (page - 1) * limit;

      const [total, items] = await Promise.all([
        prisma.interviewerProfile.count({ where }),
        prisma.interviewerProfile.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            user: { select: { id: true, name: true, avatar: true } },
            tags: { include: { tag: true } },
          },
        }),
      ]);

      if (total === 0 && !search && !tags && !experienceLevel) {
        return { total: SAMPLE_INTERVIEWERS.length, items: SAMPLE_INTERVIEWERS as any };
      }

      return { total, items };
    } catch (err) {
      console.warn('Marketplace query fallback to sample interviewers:', (err as Error).message);
      return { total: SAMPLE_INTERVIEWERS.length, items: SAMPLE_INTERVIEWERS as any };
    }
  }

  async getInterviewerById(id: string) {
    if (!isDbConnected()) {
      return SAMPLE_INTERVIEWERS.find((s) => s.id === id) || null;
    }

    try {
      return await prisma.interviewerProfile.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, name: true, avatar: true, createdAt: true } },
          tags: { include: { tag: true } },
          reviews: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              booking: { include: { candidate: { select: { name: true, avatar: true } } } },
            },
          },
          availabilitySlots: { where: { isActive: true } },
        },
      });
    } catch (err) {
      return null;
    }
  }
}

export const marketplaceRepository = new MarketplaceRepository();
