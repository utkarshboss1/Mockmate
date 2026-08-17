'use client';

import { useState } from 'react';
import { api, getErrorMessage } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Star, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ReviewModalProps {
  bookingId: string;
  interviewerName: string;
  onSubmitted?: () => void;
}

export function ReviewModal({ bookingId, interviewerName, onSubmitted }: ReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmitReview = async () => {
    if (!comment.trim()) {
      setError('Please enter a review comment');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await api.post('/feedback/reviews', {
        bookingId,
        rating,
        comment,
      });

      setSuccess(true);
      if (onSubmitted) onSubmitted();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <Alert className="border-emerald-500/50 bg-emerald-500/10 text-emerald-400">
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>Thank you for submitting your review!</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base font-semibold">Rate Your Session with {interviewerName}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Star Rating Picker */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="p-1 hover:scale-110 transition-transform"
            >
              <Star
                className={`h-6 w-6 ${
                  star <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'
                }`}
              />
            </button>
          ))}
          <span className="text-xs font-semibold text-muted-foreground ml-2">{rating} / 5 Stars</span>
        </div>

        {/* Review Comment */}
        <div className="space-y-1.5">
          <Label className="text-xs">Public Review & Comments</Label>
          <Textarea
            rows={3}
            placeholder="Share your experience (e.g. Helpful feedback, realistic interview questions...)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="text-xs"
          />
        </div>

        <Button
          onClick={handleSubmitReview}
          size="sm"
          className="w-full text-xs font-semibold"
          disabled={saving || !comment.trim()}
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
          Submit Review
        </Button>
      </CardContent>
    </Card>
  );
}
