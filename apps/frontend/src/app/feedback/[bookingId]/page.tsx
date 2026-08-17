'use client';

import { useState, useEffect, use } from 'react';
import { api, getErrorMessage } from '@/lib/api';
import { FeedbackView } from '@/features/feedback/components/FeedbackView';
import { ReviewModal } from '@/features/feedback/components/ReviewModal';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function CandidateFeedbackPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params);
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFeedback() {
      try {
        setLoading(true);
        const res = await api.get(`/feedback/booking/${bookingId}`);
        setFeedback(res.data.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    fetchFeedback();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="container max-w-4xl py-12 space-y-6">
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !feedback) {
    return (
      <div className="container max-w-xl py-20 text-center space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Feedback not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-10 px-4 space-y-8">
      <FeedbackView feedback={feedback} />

      {/* Optional Candidate Review Card */}
      {!feedback.booking?.review && (
        <div className="max-w-xl mx-auto">
          <ReviewModal
            bookingId={bookingId}
            interviewerName={feedback.booking.interviewerProfile.user.name}
          />
        </div>
      )}
    </div>
  );
}
