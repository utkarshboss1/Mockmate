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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogOut, Video, Sparkles, AlertCircle } from 'lucide-react';

export default function InterviewRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [token, setToken] = useState<string | null>(null);
  const [interviewData, setInterviewData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://demo.livekit.cloud';

  const targetDashboard = user?.role === 'INTERVIEWER' ? '/interviewer/dashboard' : '/dashboard';

  useEffect(() => {
    async function joinRoom() {
      try {
        setLoading(true);
        setError(null);

        // Fetch user profile and token in parallel
        const [tokenRes, userRes] = await Promise.all([
          api.post(`/interviews/${id}/token`),
          api.get('/users/me').catch(() => ({ data: { data: null } })),
        ]);

        const { token: roomToken, interview } = tokenRes.data.data;
        setToken(roomToken);
        setInterviewData(interview);

        if (userRes.data?.data) {
          setCurrentUser({ id: userRes.data.data.id, name: userRes.data.data.name });
        } else {
          // Default fallback to candidate from booking data
          setCurrentUser({
            id: interview?.booking?.candidate?.id || 'user_1',
            name: interview?.booking?.candidate?.name || 'User',
          });
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }

    joinRoom();
  }, [id]);

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
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Joining LiveKit Interview Room...</p>
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

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Top Room Navigation Bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border/50 bg-card/80 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-bold text-base font-heading">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" /> InterviewIQ Live Room
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
            className="gap-1.5 font-semibold text-xs shadow-lg shadow-destructive/20"
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
              currentUserId={currentUser?.id || interviewData?.booking?.candidate?.id || 'user'}
              currentUserName={currentUser?.name || interviewData?.booking?.candidate?.name || 'User'}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
