// ============================================================
// admin.routes.ts — Router for Admin & Analytics
// ============================================================

import { Router } from 'express';
import { adminController } from './admin.controller';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate';
import { updateUserStatusSchema, adminUserQuerySchema } from './admin.validator';
import { UserRole } from '@interviewiq/shared';

const router = Router();

// Strict RBAC enforcement — only ADMIN can access admin routes
router.use(requireAuth, requireRole(UserRole.ADMIN));

router.get('/analytics', (req, res, next) => adminController.getAnalytics(req, res, next));

router.get('/users', validate(adminUserQuerySchema, 'query'), (req, res, next) =>
  adminController.listUsers(req, res, next),
);

router.patch('/users/:id/status', validate(updateUserStatusSchema), (req, res, next) =>
  adminController.updateUserStatus(req, res, next),
);

export const adminRouter = router;
