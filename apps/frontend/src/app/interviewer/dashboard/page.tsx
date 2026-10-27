'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { BookingCard } from '@/features/booking/components/BookingCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import {
  Calendar,
  IndianRupee,
  Award,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  UserCheck,
  CalendarX,
} from 'lucide-react';

export default function InterviewerDashboardPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [bookingsRes, userRes] = await Promise.all([
          api.get('/bookings/interviewer?limit=5').catch(() => ({ data: { data: [] } })),
          api.get('/users/me').catch(() => ({ data: { data: null } })),
        ]);

        setBookings(bookingsRes.data?.data || []);
        setUserProfile(userRes.data?.data || null);
      } catch (err) {
        console.error('Failed to load interviewer dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const totalEarningsPaise = bookings
    .filter((b) => b.status === 'COMPLETED' || b.status === 'CONFIRMED')
    .reduce((sum, b) => sum + (b.interviewerPayoutPaise || 0), 0);

  const profileObj = userProfile?.interviewerProfile;
  const isProfileComplete = Boolean(
    profileObj && profileObj.headline && profileObj.bio && profileObj.pricePerHour > 0,
  );

  return (
    <div className="container max-w-6xl py-10 px-4 space-y-8">
      {/* Header & Welcome Greeting */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Interviewer Dashboard</h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Expert Interviewer
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Welcome back, <span className="font-semibold text-foreground">{user?.name || 'Interviewer'}</span>! Manage your session requests, earnings, and availability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
            <Link href="/interviewer/profile">
              <UserCheck className="h-4 w-4" /> Edit Profile & Rates
            </Link>
          </Button>
          <Button asChild size="sm" className="gap-1.5 text-xs font-semibold">
            <Link href="/interviewer/availability">
              <Clock className="h-4 w-4" /> Set Availability
            </Link>
          </Button>
        </div>
      </div>

      {/* Onboarding Guide Card for New / Incomplete Profile Interviewers */}
      {(!isProfileComplete || bookings.length === 0) && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Sparkles className="h-32 w-32 text-primary" />
          </div>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-bold text-lg">
                <Sparkles className="h-5 w-5" /> Quick Start & Onboarding Guide
              </div>
              <Badge variant="secondary" className="text-xs bg-primary/20 text-primary border-none font-mono">
                Action Required
              </Badge>
            </div>
            <CardDescription className="text-muted-foreground">
              Complete your profile and availability, then an admin will review your listing before candidates can book you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {profileObj && !profileObj.isVerified && (
                <div className="md:col-span-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
                  Your profile is pending admin approval. Candidates will see it in the marketplace after it is approved.
                </div>
              )}
              {/* Step 1 */}
              <div className="p-4 rounded-xl border border-border/50 bg-card/60 space-y-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary uppercase">Step 1</span>
                    {isProfileComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                    )}
                  </div>
                  <h4 className="font-semibold text-sm">Profile & Hourly Rate (₹)</h4>
                  <p className="text-xs text-muted-foreground">
                    Set your headline, bio, experience level, and hourly pricing in ₹ (INR).
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full text-xs mt-3">
                  <Link href="/interviewer/profile" className="flex items-center justify-between">
                    <span>{isProfileComplete ? 'Update Profile' : 'Set Profile & Rate'}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl border border-border/50 bg-card/60 space-y-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary uppercase">Step 2</span>
                    <Clock className="h-4 w-4 text-violet-400" />
                  </div>
                  <h4 className="font-semibold text-sm">Weekly Availability Slots</h4>
                  <p className="text-xs text-muted-foreground">
                    Define the recurring days and hours when candidates can book 60-min sessions.
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full text-xs mt-3">
                  <Link href="/interviewer/availability" className="flex items-center justify-between">
                    <span>Set Availability</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl border border-border/50 bg-card/60 space-y-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary uppercase">Step 3</span>
                    <CalendarX className="h-4 w-4 text-amber-400" />
                  </div>
                  <h4 className="font-semibold text-sm">Blackout & Session Blocking</h4>
                  <p className="text-xs text-muted-foreground">
                    Block out specific dates or vacation windows so candidates cannot double-book.
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full text-xs mt-3">
                  <Link href="/interviewer/availability?tab=blackout" className="flex items-center justify-between">
                    <span>Manage Blackouts</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Earnings Card */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Payout Earnings</CardTitle>
            <IndianRupee className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-bold text-emerald-400">{formatCurrency(totalEarningsPaise)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalEarningsPaise === 0
                ? 'Your payout earnings will appear here once sessions are completed'
                : '100% net earnings after platform fee'}
            </p>
          </CardContent>
        </Card>

        {/* Total Sessions Booked Card */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Sessions Booked</CardTitle>
            <Award className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-bold">{bookings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {bookings.length === 0 ? 'No session requests yet' : 'Total candidate bookings'}
            </p>
          </CardContent>
        </Card>

        {/* Schedule & Rate Quick Card */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-xl flex flex-col justify-between">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">Hourly Rate & Status</CardTitle>
            <Clock className="h-4 w-4 text-violet-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Current Rate:</span>
              <span className="text-base font-bold text-primary">
                {profileObj?.pricePerHour ? formatCurrency(profileObj.pricePerHour) : '₹800'}/hr
              </span>
            </div>
            <Button asChild size="sm" variant="outline" className="w-full text-xs">
              <Link href="/interviewer/availability">Edit Availability & Blackouts</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Booked Sessions */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" /> Booked Sessions
          </h2>
          {bookings.length > 0 && (
            <Button asChild variant="ghost" size="sm" className="text-xs text-primary">
              <Link href="/interviewer/bookings">View All</Link>
            </Button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        ) : bookings.length === 0 ? (
          <Card className="border-dashed border-border/60 bg-card/40 p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-base">No Sessions Booked Yet</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Once candidates book a mock interview from your profile, your upcoming sessions will appear here with full candidate details, code editor link, and video room.
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="text-xs gap-1.5">
              <Link href={profileObj?.id ? `/marketplace/${profileObj.id}` : '/interviewer/profile'} target="_blank">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Preview Your Public Profile
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {bookings.map((b) => (
              <BookingCard key={b.id} booking={b} userRole="interviewer" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
