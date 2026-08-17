// ============================================================
// marketplace.service.ts — Marketplace Business Logic Layer
// ============================================================

import { marketplaceRepository, MarketplaceRepository } from './marketplace.repository';
import { MarketplaceQueryInput } from './marketplace.validator';
import { buildPaginationMeta } from '../../types';
import { errors } from '../../middleware/error.middleware';

export class MarketplaceService {
  constructor(private repository: MarketplaceRepository) {}

  async searchInterviewers(input: MarketplaceQueryInput) {
    const { total, items } = await this.repository.searchInterviewers(input);
    const meta = buildPaginationMeta(total, input.page, input.limit);

    // Format output tags cleanly
    const formattedItems = items.map((item: any) => ({
      ...item,
      tags: item.tags.map((t: any) => t.tag),
    }));

    return { items: formattedItems, meta };
  }

  async getInterviewerDetails(id: string) {
    const profile = await this.repository.getInterviewerById(id);
    if (!profile) {
      throw errors.notFound('Interviewer profile');
    }

    return {
      ...profile,
      tags: profile.tags.map((t: any) => t.tag),
    };
  }
}

export const marketplaceService = new MarketplaceService(marketplaceRepository);
