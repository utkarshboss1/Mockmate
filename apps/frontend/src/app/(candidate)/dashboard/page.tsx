'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { BookingCard } from '@/features/booking/components/BookingCard';
import { PrepAdvisorWidget } from '@/features/ai/components/PrepAdvisorWidget';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Video, Search, Sparkles, AlertCircle } from 'lucide-react';

export default function CandidateDashboardPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookings() {
      try {
        setLoading(true);
        const res = await api.get('/bookings/candidate?limit=5');
        setBookings(res.data.data);
      } catch (err) {
        console.error('Failed to load candidate bookings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, []);

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

        {loading ? (
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
