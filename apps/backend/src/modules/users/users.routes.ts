// ============================================================
// users.routes.ts — Router for User & Profile Endpoints
// ============================================================

import { Router } from 'express';
import multer from 'multer';
import { usersController } from './users.controller';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate';
import { updateCandidateProfileSchema, updateInterviewerProfileSchema } from './users.validator';
import { UserRole } from '@interviewiq/shared';
import { errors } from '../../middleware/error.middleware';

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(errors.badRequest('Only image files are allowed'));
    }
  },
});

const router = Router();

// Public routes
router.get('/tags', (req, res, next) => usersController.getTags(req, res, next));

// Protected routes
router.use(requireAuth);

router.get('/me', (req, res, next) => usersController.getMe(req, res, next));

router.put('/profile', validate(updateCandidateProfileSchema), (req, res, next) =>
  usersController.updateCandidateProfile(req, res, next),
);

router.put(
  '/interviewer-profile',
  requireRole(UserRole.INTERVIEWER, UserRole.ADMIN),
  validate(updateInterviewerProfileSchema),
  (req, res, next) => usersController.updateInterviewerProfile(req, res, next),
);

router.post('/avatar', upload.single('avatar'), (req, res, next) =>
  usersController.uploadAvatar(req, res, next),
);

export const usersRouter = router;
