'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { api, getErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { LiveVideoRoom } from '@/features/interview/components/LiveVideoRoom';
import { CodeEditor } from '@/features/interview/components/CodeEditor';
import { ChatPanel } from '@/features/interview/components/ChatPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  LogOut,
  Sparkles,
  AlertCircle,
  Calendar,
  Clock,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

interface InterviewDetails {
  booking?: {
    scheduledAt?: string | null;
    interviewType?: string;
    candidate?: { name?: string } | null;
    interviewer?: { name?: string } | null;
  } | null;
}

export default function InterviewRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [token, setToken] = useState<string | null>(null);
  const [interviewData, setInterviewData] = useState<InterviewDetails | null>(null);
  const [tooEarly, setTooEarly] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://demo.livekit.cloud';
  const targetDashboard = user?.role === 'INTERVIEWER' ? '/interviewer/dashboard' : '/dashboard';

  async function joinRoom() {
    try {
      setLoading(true);
      setError(null);

      const tokenRes = await api.post(`/interviews/${id}/token`);
      const resData = tokenRes.data.data;

      if (resData.tooEarly) {
        setTooEarly(true);
        setScheduledAt(resData.scheduledAt);
        setInterviewData(resData.interview);
        setToken(null);
        return;
      }

      setTooEarly(false);
      setToken(resData.token);
      setInterviewData(resData.interview);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    joinRoom();
  }, [id]);

  // Live countdown timer for the waiting lobby
  useEffect(() => {
    if (!tooEarly || !scheduledAt) return;

    function updateCountdown() {
      const targetTime = new Date(scheduledAt!).getTime();
      const now = Date.now();
      const diffMs = targetTime - now;

      // When within 10 minutes (600,000 ms), auto-join the live room
      if (diffMs <= 10 * 60 * 1000) {
        joinRoom();
        return;
      }

      const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      if (days > 0) {
        setTimeLeftStr(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeftStr(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );
      }
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [tooEarly, scheduledAt]);

  const currentUserId = user?.id ?? '';
  const currentUserName = user?.name ?? 'User';

  const handleEndSession = async () => {
    if (confirm('Are you sure you want to leave and conclude this interview session?')) {
      try {
        await api.patch(`/interviews/${id}/end`);
      } catch (err) {
        console.error('Failed to mark session as ended:', err);
      } finally {
        router.push(targetDashboard);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Checking LiveKit Room Status...</p>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // EARLY JOIN WAITING LOBBY (> 10 mins prior to scheduled time)
  // ══════════════════════════════════════════════════════════════════
  if (tooEarly && scheduledAt) {
    const formattedDate = new Date(scheduledAt).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const formattedTime = new Date(scheduledAt).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <div className="container max-w-2xl py-16 px-4 flex flex-col items-center justify-center min-h-[85vh]">
        <Card className="w-full border-border/60 bg-card/90 backdrop-blur-2xl shadow-2xl overflow-hidden p-8 sm:p-10 space-y-8 text-center relative">
          {/* Subtle Glow Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-semibold">
            <Clock className="h-4 w-4" /> Room Opens 10 Minutes Before Start
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading text-foreground">
              Meeting is Scheduled
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Your mock interview session has been reserved. You can enter the live room starting{' '}
              <span className="text-foreground font-semibold">10 minutes prior</span> to the scheduled start time.
            </p>
          </div>

          {/* Scheduled Date & Time Card */}
          <div className="p-6 rounded-2xl bg-secondary/50 border border-border/60 space-y-3">
            <div className="flex items-center justify-center gap-2 text-primary font-bold text-sm">
              <Calendar className="h-4 w-4" /> {formattedDate}
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-foreground font-heading tracking-tight">
              {formattedTime}
            </div>
            {interviewData?.booking?.interviewType && (
              <Badge variant="outline" className="text-xs uppercase font-mono bg-background border-border/80">
                {interviewData.booking.interviewType.replace('_', ' ')}
              </Badge>
            )}
          </div>

          {/* Real-time Countdown Box */}
          <div className="space-y-2">
            <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Time Remaining Until Session
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-primary tracking-widest bg-background/80 py-3 px-6 rounded-xl border border-white/[0.08] inline-block shadow-inner">
              {timeLeftStr || 'Calculating...'}
            </div>
            <p className="text-[11px] text-muted-foreground">
              This page will automatically admit you once the room opens.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-border/40">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto font-medium text-xs h-11 px-6 rounded-xl border-border/60 cursor-pointer"
              onClick={() => router.push(targetDashboard)}
            >
              Return to Dashboard
            </Button>
            <Button
              size="lg"
              className="w-full sm:w-auto font-semibold text-xs h-11 px-6 rounded-xl glow-primary cursor-pointer gap-2"
              onClick={() => joinRoom()}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Check Room Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="container max-w-xl py-20 space-y-4 text-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Failed to connect to room'}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push(targetDashboard)}>Return to Dashboard</Button>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // ACTIVE LIVE INTERVIEW WORKSPACE
  // ══════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Top Room Navigation Bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border/50 bg-card/80 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-bold text-base font-heading">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" /> MockMate Live Room
          </div>
          <Badge variant="outline" className="text-xs uppercase font-mono bg-primary/10 text-primary border-primary/20">
            {interviewData?.booking?.interviewType?.replace('_', ' ')}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs text-muted-foreground hidden sm:block">
            Session: <span className="font-semibold text-foreground">{interviewData?.booking?.candidate?.name}</span> &{' '}
            <span className="font-semibold text-foreground">{interviewData?.booking?.interviewer?.name}</span>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleEndSession}
            className="gap-1.5 font-semibold text-xs shadow-lg shadow-destructive/20 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" /> End & Leave Room
          </Button>
        </div>
      </header>

      {/* Main Dual Workspace Grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 min-h-0">
        {/* Left Column — Monaco Code Editor (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col min-h-0">
          <CodeEditor interviewId={id} />
        </div>

        {/* Right Column — LiveKit WebRTC Video Tiles & Chat (4 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4 min-h-0">
          <div className="flex-1 min-h-[300px]">
            <LiveVideoRoom token={token} serverUrl={serverUrl} onLeave={handleEndSession} />
          </div>

          <div className="h-64">
            <ChatPanel
              interviewId={id}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
