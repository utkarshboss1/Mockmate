// In-memory booking storage for memory mode.

export interface MockStoredBooking {
  id: string;
  candidateId: string;
  interviewerProfileId: string;
  scheduledAt: Date;
  durationMinutes: number;
  interviewType: string;
  status: string;
  totalAmountPaise: number;
  platformFeePaise: number;
  interviewerPayoutPaise: number;
  paymentDueAt: Date | null;
  notes: string | null;
  candidate: { id: string; name: string; email: string; avatar: string | null };
  interviewerProfile: {
    id: string;
    userId: string;
    user: { id: string; name: string; email: string; avatar: string | null };
  };
  payment: { id: string; status: string; refundedAmountPaise: number } | null;
  interview: { id: string; status: string; roomName: string } | null;
}

const bookingsById = new Map<string, MockStoredBooking>();

export const mockBookingStore = {
  saveBooking(booking: MockStoredBooking): MockStoredBooking {
    bookingsById.set(booking.id, booking);
    return booking;
  },

  findBookingById(id: string): MockStoredBooking | undefined {
    return bookingsById.get(id);
  },

  findBookingsByCandidate(candidateId: string): MockStoredBooking[] {
    const list: MockStoredBooking[] = [];
    for (const b of bookingsById.values()) {
      if (b.candidateId === candidateId) {
        list.push(b);
      }
    }
    return list;
  },

  findBookingsByInterviewer(interviewerProfileId: string): MockStoredBooking[] {
    const list: MockStoredBooking[] = [];
    for (const b of bookingsById.values()) {
      if (b.interviewerProfileId === interviewerProfileId) {
        list.push(b);
      }
    }
    return list;
  },

  updateBookingStatus(id: string, status: string, notes?: string): MockStoredBooking | undefined {
    const booking = bookingsById.get(id);
    if (booking) {
      booking.status = status;
      if (notes) booking.notes = notes;
      if (status === 'CONFIRMED') {
        booking.payment = {
          id: `pay_${Date.now()}`,
          status: 'SUCCEEDED',
          refundedAmountPaise: 0,
        };
        booking.interview = { id: `i_${Date.now()}`, status: 'READY', roomName: `room_${id}` };
      }
    }
    return booking;
  },

  /**
   * Mark a booking's payment as (partially) refunded. Used by the
   * cancellation refund flow when STORAGE_MODE=memory.
   */
  recordRefund(id: string, refundedAmountPaise: number): MockStoredBooking | undefined {
    const booking = bookingsById.get(id);
    if (!booking?.payment) return booking;
    booking.payment.status = refundedAmountPaise >= booking.totalAmountPaise ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    booking.payment.refundedAmountPaise = refundedAmountPaise;
    return booking;
  },
};
