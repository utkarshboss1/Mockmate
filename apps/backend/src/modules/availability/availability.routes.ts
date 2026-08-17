// ============================================================
// availability.routes.ts — Availability Router
// ============================================================

import { Router } from 'express';
import { availabilityController } from './availability.controller';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate';
import { updateAvailabilitySchema, getBookableSlotsQuerySchema, createBlockedSlotSchema } from './availability.validator';
import { UserRole } from '@interviewiq/shared';

const router = Router();

// Public route for candidate slot discovery
router.get(
  '/interviewers/:id/slots',
  validate(getBookableSlotsQuerySchema, 'query'),
  (req, res, next) => availabilityController.getInterviewerBookableSlots(req, res, next),
);

// Protected interviewer routes
router.use(requireAuth, requireRole(UserRole.INTERVIEWER, UserRole.ADMIN));

router.get('/my-slots', (req, res, next) => availabilityController.getMyWeeklySlots(req, res, next));

router.put('/my-slots', validate(updateAvailabilitySchema), (req, res, next) =>
  availabilityController.updateMyWeeklySlots(req, res, next),
);

// Blocked Slots / Blackout Session management
router.get('/blocked-slots', (req, res, next) =>
  availabilityController.getMyBlockedSlots(req, res, next),
);

router.post('/blocked-slots', validate(createBlockedSlotSchema), (req, res, next) =>
  availabilityController.createMyBlockedSlot(req, res, next),
);

router.delete('/blocked-slots/:id', (req, res, next) =>
  availabilityController.deleteMyBlockedSlot(req, res, next),
);

export const availabilityRouter = router;
