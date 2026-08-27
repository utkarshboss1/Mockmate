'use client';

import { useState } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  PhoneOff,
  UserCheck,
  AlertTriangle,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface LiveVideoRoomProps {
  token: string;
  serverUrl: string;
  onLeave?: () => void;
}

export function LiveVideoRoom({ token, serverUrl, onLeave }: LiveVideoRoomProps) {
  const [connectError, setConnectError] = useState<boolean>(false);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);

  const isDemoUrl =
    !serverUrl ||
    serverUrl.includes('demo.livekit.cloud') ||
    serverUrl.includes('your-app.livekit.cloud');

  if (!token || !serverUrl) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-border/50 rounded-xl bg-card h-full min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-xs text-muted-foreground font-medium">Connecting to media server...</p>
      </div>
    );
  }

  // Interactive Fallback Video Stage for Mock / Offline mode or invalid LiveKit keys
  if (connectError || isDemoUrl) {
    return (
      <div className="flex flex-col h-full rounded-xl border border-border/50 overflow-hidden bg-card/90 shadow-xl relative min-h-[300px]">
        {/* Top Status Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b border-border/40 text-xs">
          <div className="flex items-center gap-2 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Live Session (Simulated Mode)</span>
          </div>
          {isDemoUrl && (
            <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20 gap-1">
              <AlertTriangle className="h-3 w-3" /> LiveKit Cloud Credentials Needed for WebRTC
            </Badge>
          )}
        </div>

        {/* Video Tiles Stage */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 min-h-0 bg-slate-950/60">
          {/* Peer Tile (Interviewer / Candidate) */}
          <div className="relative rounded-lg overflow-hidden bg-slate-900 border border-white/10 flex flex-col items-center justify-center p-4 group">
            <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mb-2 shadow-lg glow-primary">
              <UserCheck className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xs font-semibold text-foreground">Interview Partner</p>
            <Badge variant="secondary" className="text-[10px] mt-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              Connected & Listening
            </Badge>
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] text-white">
              <Mic className="h-3 w-3 text-emerald-400" /> Peer Mic Active
            </div>
          </div>

          {/* Self Tile (Local User) */}
          <div className="relative rounded-lg overflow-hidden bg-slate-900 border border-white/10 flex flex-col items-center justify-center p-4">
            {videoOn ? (
              <div className="w-16 h-16 rounded-full bg-indigo-500/20 border-2 border-indigo-400 flex items-center justify-center mb-2">
                <Sparkles className="h-7 w-7 text-indigo-400 animate-pulse" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-muted border-2 border-muted-foreground/30 flex items-center justify-center mb-2">
                <VideoOff className="h-7 w-7 text-muted-foreground" />
              </div>
            )}
            <p className="text-xs font-semibold text-foreground">You (Local User)</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {videoOn ? 'Camera Active' : 'Camera Off'}
            </p>
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] text-white">
              {micOn ? <Mic className="h-3 w-3 text-emerald-400" /> : <MicOff className="h-3 w-3 text-red-400" />}
              {micOn ? 'Mic Unmuted' : 'Muted'}
            </div>
          </div>
        </div>

        {/* Floating Controls Bar */}
        <div className="flex items-center justify-center gap-3 p-3 bg-muted/30 border-t border-border/40 shrink-0">
          <Button
            size="icon"
            variant={micOn ? 'secondary' : 'destructive'}
            onClick={() => setMicOn(!micOn)}
            className="h-9 w-9 rounded-full shadow"
            aria-label={micOn ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </Button>

          <Button
            size="icon"
            variant={videoOn ? 'secondary' : 'destructive'}
            onClick={() => setVideoOn(!videoOn)}
            className="h-9 w-9 rounded-full shadow"
            aria-label={videoOn ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {videoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </Button>

          <Button
            size="icon"
            variant={screenSharing ? 'default' : 'outline'}
            onClick={() => setScreenSharing(!screenSharing)}
            className="h-9 w-9 rounded-full shadow"
            aria-label="Share Screen"
          >
            <Monitor className="h-4 w-4" />
          </Button>

          {onLeave && (
            <Button
              size="icon"
              variant="destructive"
              onClick={onLeave}
              className="h-9 w-9 rounded-full shadow"
              aria-label="Leave Room"
            >
              <PhoneOff className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={serverUrl}
      onDisconnected={onLeave}
      onError={(err) => {
        console.warn('LiveKit Room connection failed, switching to simulated stage:', err);
        setConnectError(true);
      }}
      data-lk-theme="default"
      className="flex flex-col h-full rounded-xl border border-border/50 overflow-hidden bg-card/90 shadow-xl"
    >
      <div className="flex-1 min-h-[300px] relative">
        <VideoConference />
      </div>
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
