// ============================================================
// booking.routes.ts — Router for Bookings
// ============================================================

import { Router } from 'express';
import { bookingController } from './booking.controller';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate';
import { createBookingSchema, cancelBookingSchema, getBookingsQuerySchema } from './booking.validator';
import { UserRole } from '@interviewiq/shared';

const router = Router();

// All booking routes require authentication
router.use(requireAuth);

router.post('/', validate(createBookingSchema), (req, res, next) =>
  bookingController.create(req, res, next),
);

router.get('/candidate', validate(getBookingsQuerySchema, 'query'), (req, res, next) =>
  bookingController.getCandidateBookings(req, res, next),
);

router.get(
  '/interviewer',
  requireRole(UserRole.INTERVIEWER, UserRole.ADMIN),
  validate(getBookingsQuerySchema, 'query'),
  (req, res, next) => bookingController.getInterviewerBookings(req, res, next),
);

router.get('/:id', (req, res, next) => bookingController.getDetails(req, res, next));

router.patch('/:id/cancel', validate(cancelBookingSchema), (req, res, next) =>
  bookingController.cancel(req, res, next),
);

export const bookingRouter = router;
