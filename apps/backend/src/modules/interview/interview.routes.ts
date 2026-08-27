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
router.get('/:id/messages', (req, res, next) => interviewController.getMessages(req, res, next));
router.post('/:id/snapshot', (req, res, next) => interviewController.saveSnapshot(req, res, next));

export const interviewRouter = router;
