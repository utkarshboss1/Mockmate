// ============================================================
// bookingStore.ts — Shared In-Memory Booking Registry
// Ensures mock mode accurately associates created bookings with genuine users
// ============================================================

export interface StoredBooking {
  id: string;
  candidateId: string;
  interviewerProfileId: string;
  scheduledAt: Date;
  durationMinutes: number;
  interviewType: string;
  status: string;
  totalAmountCents: number;
  platformFeeCents: number;
  interviewerPayoutCents: number;
  notes: string | null;
  candidate: { id: string; name: string; email: string; avatar: string | null };
  interviewerProfile: {
    id: string;
    userId: string;
    user: { id: string; name: string; email: string; avatar: string | null };
  };
  payment: { id: string; status: string } | null;
  interview: { id: string; status: string; roomName: string } | null;
}

const bookingsById = new Map<string, StoredBooking>();

export const bookingStore = {
  saveBooking(booking: StoredBooking): StoredBooking {
    bookingsById.set(booking.id, booking);
    return booking;
  },

  findBookingById(id: string): StoredBooking | undefined {
    return bookingsById.get(id);
  },

  findBookingsByCandidate(candidateId: string): StoredBooking[] {
    const list: StoredBooking[] = [];
    for (const b of bookingsById.values()) {
      if (b.candidateId === candidateId) {
        list.push(b);
      }
    }
    return list;
  },

  findBookingsByInterviewer(interviewerProfileId: string): StoredBooking[] {
    const list: StoredBooking[] = [];
    for (const b of bookingsById.values()) {
      if (b.interviewerProfileId === interviewerProfileId) {
        list.push(b);
      }
    }
    return list;
  },

  updateBookingStatus(id: string, status: string): StoredBooking | undefined {
    const booking = bookingsById.get(id);
    if (booking) {
      booking.status = status;
      if (status === 'CONFIRMED') {
        booking.payment = { id: `pay_${Date.now()}`, status: 'SUCCEEDED' };
        booking.interview = { id: `i_${Date.now()}`, status: 'READY', roomName: `room_${id}` };
      }
    }
    return booking;
  },
};
