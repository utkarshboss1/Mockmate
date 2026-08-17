// ============================================================
// marketplace.controller.ts — Marketplace Express Controller
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { marketplaceService } from './marketplace.service';
import { paginatedResponse, successResponse } from '../../types';

export class MarketplaceController {
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { items, meta } = await marketplaceService.searchInterviewers(req.query as any);
      res.json(paginatedResponse(items, meta));
    } catch (error) {
      next(error);
    }
  }

  async getDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const details = await marketplaceService.getInterviewerDetails(req.params.id);
      res.json(successResponse(details));
    } catch (error) {
      next(error);
    }
  }
}

export const marketplaceController = new MarketplaceController();
