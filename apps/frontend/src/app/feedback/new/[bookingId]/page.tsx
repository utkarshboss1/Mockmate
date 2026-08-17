'use client';

import { useState, useEffect, use } from 'react';
import { api, getErrorMessage } from '@/lib/api';
import { FeedbackForm } from '@/features/feedback/components/FeedbackForm';
import { Skeleton } from '@/components/ui/skeleton';

export default function NewFeedbackPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params);
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBooking() {
      try {
        setLoading(true);
        const res = await api.get(`/bookings/${bookingId}`);
        setBooking(res.data.data);
      } catch (err) {
        console.error('Failed to load booking for feedback:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="container max-w-4xl py-12 space-y-6">
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container max-w-xl py-20 text-center font-semibold">
        Booking Not Found
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-10 px-4">
      <FeedbackForm bookingId={bookingId} candidateName={booking.candidate.name} />
    </div>
  );
}
