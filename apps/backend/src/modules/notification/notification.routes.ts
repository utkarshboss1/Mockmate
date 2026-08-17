// ============================================================
// notification.routes.ts — Router for Notifications
// ============================================================

import { Router } from 'express';
import { notificationController } from './notification.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', (req, res, next) => notificationController.getNotifications(req, res, next));
router.patch('/read-all', (req, res, next) => notificationController.markAllAsRead(req, res, next));
router.patch('/:id/read', (req, res, next) => notificationController.markAsRead(req, res, next));

export const notificationRouter = router;
