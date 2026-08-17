'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { BookingForm } from '@/features/booking/components/BookingForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function BookPage({ params }: { params: Promise<{ interviewerId: string }> }) {
  const { interviewerId } = use(params);
  const [interviewer, setInterviewer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user, isLoading: sessionLoading } = useAuth();
  const router = useRouter();

  // Redirect if not logged in
  useEffect(() => {
    if (!sessionLoading && !user) {
      router.push(`/login?redirect=/book/${interviewerId}`);
    }
  }, [user, sessionLoading, router, interviewerId]);

  useEffect(() => {
    async function fetchInterviewer() {
      try {
        setLoading(true);
        const res = await api.get(`/marketplace/interviewers/${interviewerId}`);
        setInterviewer(res.data.data);
      } catch (err) {
        console.error('Failed to load interviewer for booking:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchInterviewer();
  }, [interviewerId]);

  if (sessionLoading || loading) {
    return (
      <div className="container max-w-5xl py-12 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  if (!interviewer) {
    return (
      <div className="container max-w-xl py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold">Interviewer Profile Not Found</h2>
        <Button asChild>
          <Link href="/marketplace">Back to Marketplace</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-10 px-4 space-y-6">
      {/* Back Button */}
      <div>
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <Link href={`/marketplace/${interviewerId}`}>
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Profile
          </Link>
        </Button>
      </div>

      <BookingForm interviewer={interviewer} />
    </div>
  );
}
