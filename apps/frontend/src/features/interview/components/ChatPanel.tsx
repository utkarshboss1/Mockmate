'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send } from 'lucide-react';

interface ChatMessage {
  id?: string;
  senderId: string;
  senderName: string;
  content: string;
  sentAt?: string;
}

interface ChatPanelProps {
  interviewId: string;
  currentUserId: string;
  currentUserName: string;
}

export function ChatPanel({ interviewId, currentUserId, currentUserName }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const scrollBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Fetch past chat history
    async function fetchChatHistory() {
      try {
        const res = await api.get(`/interviews/${interviewId}/messages`);
        setMessages(res.data.data);
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    }
    fetchChatHistory();

    // 2. Connect Socket.IO client (authenticated handshake)
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('access_token');
      if (!token) {
        try {
          const auth = localStorage.getItem('interviewiq_auth');
          if (auth) {
            token = JSON.parse(auth).token ?? null;
          }
        } catch {}
      }
    }

    const socket = io(socketUrl, {
      path: '/socket.io',
      withCredentials: true,
      auth: { token },
    });

    socketRef.current = socket;

    socket.on('connect_error', (err) => {
      console.error('Socket connection failed:', err.message);
    });

    socket.on('room_error', (err: { message?: string }) => {
      console.error('Room join rejected:', err?.message);
    });

    // Identity is derived from the authenticated session server-side
    socket.emit('join_room', { interviewId });

    socket.on('receive_message', (newMessage: ChatMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => {
      socket.disconnect();
    };
  }, [interviewId, currentUserId, currentUserName]);

  useEffect(() => {
    scrollBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputMessage.trim();
    if (!trimmed || !socketRef.current) return;

    socketRef.current.emit('send_message', {
      interviewId,
      content: trimmed,
    });

    setInputMessage('');
  };

  return (
    <div className="flex flex-col h-full border border-border/50 rounded-xl bg-card overflow-hidden shadow-xl">
      <div className="p-3 bg-muted/40 border-b border-border/40 font-semibold text-xs flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-primary" /> Live Chat
      </div>

      {/* Messages Scroll Area */}
      <div
        className="flex-1 p-3 overflow-y-auto space-y-3 min-h-[200px]"
        role="log"
        aria-live="polite"
        aria-label="Interview chat messages"
      >
        {messages.length === 0 ? (
          <p className="text-xs text-muted-foreground italic text-center py-4">
            No messages yet. Say hello!
          </p>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id || idx}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-muted-foreground mb-0.5 px-1">
                  {isMe ? 'You' : msg.senderName}
                </span>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs ${
                    isMe
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-muted text-foreground rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={scrollBottomRef} />
      </div>

      {/* Send Message Form */}
      <form onSubmit={handleSendMessage} className="p-2 border-t border-border/40 flex gap-2">
        <Input
          placeholder="Type message..."
          aria-label="Type a message"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="h-8 text-xs"
        />
        <Button type="submit" size="icon" className="h-8 w-8 shrink-0" aria-label="Send message">
          <Send className="h-3.5 w-3.5" />
        </Button>
      </form>
    </div>
  );
}
