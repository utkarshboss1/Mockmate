'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Briefcase, Award, CheckCircle2, ArrowRight, Calendar, ExternalLink, ArrowLeft } from 'lucide-react';
import { formatCurrency, getInitials } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function InterviewerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [interviewer, setInterviewer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user?.role === 'INTERVIEWER') router.replace('/interviewer/dashboard');
  }, [authLoading, user, router]);

  useEffect(() => {
    async function fetchInterviewer() {
      try {
        setLoading(true);
        const res = await api.get(`/marketplace/interviewers/${id}`);
        setInterviewer(res.data.data);
      } catch (err) {
        console.error('Failed to fetch interviewer details:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchInterviewer();
  }, [id]);

  if (authLoading || user?.role === 'INTERVIEWER') return null;

  if (loading) {
    return (
      <div className="container max-w-4xl py-12 space-y-6">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!interviewer) {
    return (
      <div className="container max-w-xl py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold">Interviewer Not Found</h2>
        <Button asChild>
          <Link href="/marketplace">Back to Marketplace</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-10 px-4 space-y-6">
      {/* Back Button */}
      <div>
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <Link href="/marketplace">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Marketplace
          </Link>
        </Button>
      </div>

      {/* Header Profile Card */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-violet-500/10 to-transparent" />
        <CardContent className="p-6 pt-0 relative">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 -mt-12">
            <div className="flex items-end gap-5">
              <Avatar className="h-24 w-24 border-4 border-background shadow-xl shrink-0">
                <AvatarImage src={interviewer.user.avatar || undefined} alt={interviewer.user.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                  {getInitials(interviewer.user.name)}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{interviewer.user.name}</h1>
                  {interviewer.isVerified && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {interviewer.jobTitle || 'Engineer'}{interviewer.company ? ` @ ${interviewer.company}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="text-right hidden sm:block">
                <span className="text-2xl font-bold text-foreground">
                  {formatCurrency(interviewer.pricePerHour)}
                </span>
                <span className="text-xs text-muted-foreground"> / hour</span>
              </div>

              <Button asChild size="lg" className="w-full sm:w-auto gap-2 font-semibold shadow-lg glow-primary">
                <Link href={`/book/${interviewer.id}`}>
                  <Calendar className="h-4 w-4" /> Book Mock Interview
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-border/40 text-sm">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <Star className="h-4 w-4 fill-amber-400" />
              {interviewer.averageRating > 0 ? interviewer.averageRating.toFixed(1) : 'New'}
              <span className="text-muted-foreground font-normal">
                ({interviewer.totalReviews} reviews)
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Award className="h-4 w-4 text-primary" />
              {interviewer.yearsOfExperience} Years Experience ({interviewer.experienceLevel})
            </div>

            {interviewer.linkedinUrl && (
              <a
                href={interviewer.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-primary hover:underline ml-auto"
              >
                LinkedIn <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column — Bio & Topics */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg">About & Interview Style</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm font-medium text-foreground/90 leading-relaxed">
                {interviewer.headline}
              </p>
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {interviewer.bio}
              </div>
            </CardContent>
          </Card>

          {/* Skill Tags */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg">Interview Topics Offered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {interviewer.tags.map((tag: any) => (
                  <Badge key={tag.id} variant="secondary" className="px-3 py-1 text-xs">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column — Booking Widget Preview */}
        <div className="space-y-6">
          <Card className="border-border/50 bg-card/80 backdrop-blur-xl sticky top-20">
            <CardHeader>
              <CardTitle className="text-lg">Session Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-muted-foreground text-sm">60-Min Mock Session</span>
                <span className="text-2xl font-bold">{formatCurrency(interviewer.pricePerHour)}</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-2 pt-2 border-t border-border/40">
                <li className="flex items-center gap-2">✓ 1-on-1 Live Video & Collaborative Code Editor</li>
                <li className="flex items-center gap-2">✓ AI-assisted Follow-up Questions</li>
                <li className="flex items-center gap-2">✓ Detailed Written Feedback & Recommendations</li>
              </ul>
              <Button asChild className="w-full gap-2 font-semibold">
                <Link href={`/book/${interviewer.id}`}>
                  Proceed to Booking <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
