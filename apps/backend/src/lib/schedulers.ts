// ============================================================
// schedulers.ts — Background Lifecycle Jobs
//
// WHY: Bookings have terminal states the request path never drives:
//   - PENDING bookings whose payment never arrives hold their slot forever
//   - CONFIRMED sessions whose start+duration passed are never COMPLETED
//     unless the interviewer happens to submit feedback
//   - NO_SHOW is never set at all
// A single interval sweeps all three transitions, idempotent by design so
// overlapping runs are harmless.
// ============================================================

import { prisma, isDbConnected } from '../lib/prisma';
import { BookingStatus, InterviewStatus } from '@interviewiq/shared';

const SWEEP_INTERVAL_MS = 60 * 1000; // every minute
const NO_SHOW_GRACE_MINUTES = 30; // session must end + grace before NO_SHOW

async function expireUnpaidPendingBookings(): Promise<number> {
  const result = await prisma.booking.updateMany({
    where: {
      status: BookingStatus.PENDING,
      paymentDueAt: { lt: new Date() },
      payment: null,
    },
    data: { status: BookingStatus.EXPIRED },
  });
  return result.count;
}

async function completePastSessions(): Promise<number> {
  const cutoff = new Date(Date.now() - NO_SHOW_GRACE_MINUTES * 60 * 1000);

  // 1. CONFIRMED sessions whose slot fully elapsed → COMPLETED
  const completed = await prisma.booking.updateMany({
    where: {
      status: BookingStatus.CONFIRMED,
      scheduledAt: { lt: cutoff },
    },
    data: { status: BookingStatus.COMPLETED },
  });

  // 2. Interview rooms for those sessions → ENDED
  await prisma.interview.updateMany({
    where: {
      status: { not: InterviewStatus.ENDED },
      booking: { status: BookingStatus.COMPLETED },
    },
    data: { status: InterviewStatus.ENDED, endedAt: new Date() },
  });

  return completed.count;
}

async function markNoShows(): Promise<number> {
  // Sessions that ended but were never joined (interview still WAITING)
  // and got no feedback → NO_SHOW.
  const result = await prisma.booking.updateMany({
    where: {
      status: BookingStatus.COMPLETED,
      scheduledAt: { lt: new Date(Date.now() - NO_SHOW_GRACE_MINUTES * 60 * 1000) },
      interview: { status: InterviewStatus.WAITING },
      feedback: null,
    },
    data: { status: BookingStatus.NO_SHOW },
  });
  return result.count;
}

export function startLifecycleSchedulers(): { stop: () => void } {
  if (!isDbConnected()) {
    // Memory mode has no persistence — lifecycle sweeps are meaningless there.
    return { stop: () => {} };
  }

  let running = true;

  const sweep = async () => {
    if (!running) return;
    try {
      const expired = await expireUnpaidPendingBookings();
      const completed = await completePastSessions();
      const noShows = await markNoShows();
      if (expired || completed || noShows) {
        console.log(
          `[scheduler] expired=${expired} completed=${completed} no_show=${noShows}`,
        );
      }
    } catch (err) {
      // Scheduler failures must never crash the server — next sweep retries.
      console.error('[scheduler] sweep failed:', err);
    }
  };

  // Run one sweep shortly after boot, then on the interval.
  const timer = setInterval(() => {
    setTimeout(() => void sweep(), 5_000);
    void sweep();
  }, SWEEP_INTERVAL_MS);

  return {
    stop: () => {
      running = false;
      clearInterval(timer);
    },
  };
}