'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { BookingCard } from '@/features/booking/components/BookingCard';
import { PrepAdvisorWidget } from '@/features/ai/components/PrepAdvisorWidget';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Search, AlertCircle, Sparkles, CreditCard, ArrowRight, ShieldCheck } from 'lucide-react';
import type { BookingLike } from '@/features/booking/components/BookingCard';

export default function CandidateDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const [bookings, setBookings] = useState<BookingLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function fetchBookings() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/bookings/candidate?limit=5', { signal: controller.signal });
        setBookings(res.data.data);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError('Failed to load your bookings. Please try again.');
          console.error('Failed to load candidate bookings:', err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }
    fetchBookings();

    return () => controller.abort();
  }, [user, authLoading]);

  const upcomingBookings = bookings.filter(
    (b) => b.status === 'CONFIRMED' || b.status === 'PENDING',
  );

  return (
    <div className="container max-w-6xl py-10 px-4 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl border border-border/50 bg-gradient-to-r from-primary/10 via-violet-500/5 to-transparent backdrop-blur-xl">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Candidate Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Track upcoming mock interview sessions, review past feedback, and practice.
          </p>
        </div>
        <Button asChild className="gap-2 font-semibold shadow-lg glow-primary">
          <Link href="/marketplace">
            <Search className="h-4 w-4" /> Find Interviewers
          </Link>
        </Button>
      </div>

      {/* Subscription & Interview Credits Card */}
      {user?.activePlan ? (
        <Card className="border-primary/40 bg-gradient-to-r from-primary/15 via-[#1E1B4B]/50 to-card/80 backdrop-blur-xl shadow-xl">
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5">
                  <Sparkles className="h-3 w-3 mr-1 inline" /> {user.activePlan === 'PRO_PREP' ? 'Pro Prep Pass' : 'FAANG All-Access'}
                </Badge>
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10 text-[10px] font-semibold">
                  Active Subscription
                </Badge>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-foreground">
                You have <span className="text-primary">{user.interviewCredits ?? 0}</span> mock session credits remaining
              </h2>
              <p className="text-xs text-muted-foreground max-w-lg">
                Your pass allows you to book 1-on-1 technical mock interviews with top FAANG engineers with zero per-session fees.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button asChild className="glow-primary bg-primary text-primary-foreground text-xs font-bold px-4 h-10 rounded-xl">
                <Link href="/marketplace">
                  Book with Credit <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="text-xs border-white/[0.1] h-10 rounded-xl">
                <Link href="/pricing">Manage Pass</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-white/[0.08] bg-card/60 backdrop-blur-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] text-muted-foreground border-white/[0.1]">
                Pay-As-You-Go Plan
              </Badge>
            </div>
            <p className="text-xs text-foreground font-medium">
              Want unlimited scorecards and 3 mock interviews included every month?
            </p>
          </div>
          <Button asChild variant="secondary" size="sm" className="text-xs font-semibold gap-1.5 shrink-0">
            <Link href="/pricing">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Upgrade to Pro Prep Pass
            </Link>
          </Button>
        </Card>
      )}

      {/* Main Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" /> Upcoming Sessions
          </h2>
          <Button asChild variant="ghost" size="sm" className="text-xs text-primary">
            <Link href="/bookings">View All Bookings</Link>
          </Button>
        </div>

        {error ? (
          <Card className="border-destructive/40 bg-destructive/5 p-8 text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
            <h3 className="font-semibold text-base">Couldn&apos;t load your sessions</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">{error}</p>
            <Button size="sm" onClick={() => window.location.reload()}>Retry</Button>
          </Card>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        ) : upcomingBookings.length === 0 ? (
          <Card className="border-dashed bg-card/40 p-8 text-center space-y-3">
            <Calendar className="h-10 w-10 text-muted-foreground mx-auto" />
            <h3 className="font-semibold text-base">No Upcoming Interviews Scheduled</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Book a 1-on-1 mock session with top engineers to sharpen your interview skills.
            </p>
            <Button asChild size="sm">
              <Link href="/marketplace">Browse Marketplace</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {upcomingBookings.map((b) => (
              <BookingCard key={b.id} booking={b} userRole="candidate" />
            ))}
          </div>
        )}
      </div>

      {/* AI Prep Advisor Widget */}
      <PrepAdvisorWidget />
    </div>
  );
}
