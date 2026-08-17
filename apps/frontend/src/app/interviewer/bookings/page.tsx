'use client';

import { useState, useEffect } from 'react';
import { api, getErrorMessage } from '@/lib/api';
import { BookingCard } from '@/features/booking/components/BookingCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from 'lucide-react';

export default function InterviewerBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookings() {
      try {
        setLoading(true);
        const res = await api.get('/bookings/interviewer');
        setBookings(res.data.data);
      } catch (err) {
        console.error('Failed to fetch interviewer bookings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId: string) => {
    const reason = prompt('Please enter a reason for cancellation:');
    if (!reason) return;

    try {
      await api.patch(`/bookings/${bookingId}/cancel`, { reason });
      setBookings(
        bookings.map((b) => (b.id === bookingId ? { ...b, status: 'CANCELLED_BY_INTERVIEWER' } : b)),
      );
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  return (
    <div className="container max-w-6xl py-10 px-4 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Calendar className="h-7 w-7 text-primary" /> Candidate Booked Sessions
        </h1>
        <p className="text-sm text-muted-foreground">
          View all candidate bookings for your mock interview sessions.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-xl p-8 bg-card/40">
          <p className="text-sm text-muted-foreground">No candidate bookings found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {bookings.map((b) => (
            <BookingCard key={b.id} booking={b} userRole="interviewer" onCancel={handleCancelBooking} />
          ))}
        </div>
      )}
    </div>
  );
}
