// ============================================================
// marketplace.repository.ts — Marketplace Database Access
// ============================================================

import { prisma } from '../../lib/prisma';
import { MarketplaceQueryInput } from './marketplace.validator';


export class MarketplaceRepository {
  async searchInterviewers(input: MarketplaceQueryInput) {
    const {
      search,
      experienceLevel,
      tags,
      minPriceRupees,
      maxPriceRupees,
      sort,
      page,
      limit,
      includeUnverified,
    } = input;

    const where: any = {};

    // Marketplace default: only admin-verified interviewers are listed.
    if (!includeUnverified) {
      where.isVerified = true;
    }

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

    return { total, items };
  }

  async getInterviewerById(id: string) {
    return prisma.interviewerProfile.findUnique({
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
  }
}

export const marketplaceRepository = new MarketplaceRepository();
