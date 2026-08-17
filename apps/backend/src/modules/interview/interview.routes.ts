// ============================================================
// interview.routes.ts — Router for Interviews & LiveKit
// ============================================================

import { Router } from 'express';
import { interviewController } from './interview.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.post('/:id/token', (req, res, next) => interviewController.getToken(req, res, next));
router.get('/:id', (req, res, next) => interviewController.getDetails(req, res, next));
router.patch('/:id/end', (req, res, next) => interviewController.endSession(req, res, next));

router.get('/:id/messages', async (req, res, next) => {
  try {
    const { isDbConnected } = await import('../../lib/prisma');
    if (!isDbConnected()) {
      const { successResponse } = await import('../../types');
      res.json(successResponse([]));
      return;
    }
    const { prisma } = await import('../../lib/prisma');
    const messages = await prisma.message.findMany({
      where: { interviewId: req.params.id },
      orderBy: { sentAt: 'asc' },
    });
    const { successResponse } = await import('../../types');
    res.json(successResponse(messages));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/snapshot', async (req, res, next) => {
  try {
    const { isDbConnected } = await import('../../lib/prisma');
    const { content, language } = req.body;
    if (!isDbConnected()) {
      const { successResponse } = await import('../../types');
      res.json(successResponse({ interviewId: req.params.id, content, language }));
      return;
    }
    const { prisma } = await import('../../lib/prisma');
    const snapshot = await prisma.codeSnapshot.upsert({
      where: { interviewId: req.params.id },
      create: { interviewId: req.params.id, content, language: language || 'javascript' },
      update: { content, language: language || 'javascript' },
    });
    const { successResponse } = await import('../../types');
    res.json(successResponse(snapshot));
  } catch (error) {
    next(error);
  }
});

export const interviewRouter = router;
