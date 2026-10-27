// ============================================================
// socket.ts — Real-Time WebSocket Server (Socket.io)
//
// WHY: Enables real-time chat messaging and collaborative code
// sync between candidates and interviewers during live sessions.
//
// SECURITY: Every connection must authenticate during the
// handshake (Bearer session token via socket.handshake.auth).
// Client-supplied userId/userName are ignored — identity always
// comes from the validated server-side session. Room membership
// is authorized against the interview's booking participants.
// ============================================================

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { env } from '../config/env';
import { prisma } from './prisma';
import { isMockStorage } from '../mockStore/mode';
import { mockUserStore as userStore } from '../mockStore/userStore';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
  authorizedInterviews?: Set<string>;
}

interface SessionIdentity {
  id: string;
  name: string;
}

async function resolveIdentity(token: string): Promise<SessionIdentity | null> {
  // 1. In-memory userStore sessions (dev / offline mode)
  const stored = userStore.findSession(token);
  if (stored && stored.expiresAt > new Date()) {
    return { id: stored.user.id, name: stored.user.name };
  }

  // 2. Prisma session table (same lookup as HTTP requireAuth)
  if (!isMockStorage()) {
    const record = await prisma.session.findUnique({
      where: { token },
      select: { expiresAt: true, user: { select: { id: true, name: true } } },
    });
    if (record && record.expiresAt > new Date()) {
      return { id: record.user.id, name: record.user.name };
    }
  }

  return null;
}

async function canAccessInterview(
  interviewId: string,
  userId: string,
): Promise<boolean> {
  if (isMockStorage()) return true; // dev-only mock mode

  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    select: {
      booking: {
        select: {
          candidateId: true,
          interviewerProfile: { select: { userId: true } },
        },
      },
    },
  });

  if (!interview) return false;
  return (
    interview.booking.candidateId === userId ||
    interview.booking.interviewerProfile.userId === userId
  );
}

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    path: '/socket.io',
  });

  // ─── Handshake Authentication ──────────────────────────────
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ?? undefined;
      if (!token || typeof token !== 'string') {
        return next(new Error('Unauthorized'));
      }

      const identity = await resolveIdentity(token.trim());
      if (!identity) {
        return next(new Error('Unauthorized'));
      }

      socket.userId = identity.id;
      socket.userName = identity.name;
      socket.authorizedInterviews = new Set();
      next();
    } catch (_) {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (rawSocket) => {
    const socket = rawSocket as AuthenticatedSocket;
    const isAuthorizedFor = async (interviewId: string): Promise<boolean> => {
      if (!socket.authorizedInterviews || !socket.userId) return false;
      if (socket.authorizedInterviews.has(interviewId)) return true;
      const allowed = await canAccessInterview(interviewId, socket.userId);
      if (allowed) socket.authorizedInterviews.add(interviewId);
      return allowed;
    };

    // 1. Join Interview Room
    socket.on('join_room', async ({ interviewId }) => {
      if (!interviewId || typeof interviewId !== 'string') return;

      if (!(await isAuthorizedFor(interviewId))) {
        socket.emit('room_error', {
          interviewId,
          message: 'You are not a participant of this interview',
        });
        return;
      }

      const roomName = `interview:${interviewId}`;
      socket.join(roomName);
      socket.to(roomName).emit('user_joined', {
        userId: socket.userId,
        userName: socket.userName,
      });

      // Fetch latest code snapshot if available
      if (!isMockStorage()) {
        try {
          const snapshot = await prisma.codeSnapshot.findUnique({
            where: { interviewId },
          });
          if (snapshot) {
            socket.emit('code_updated', {
              content: snapshot.content,
              language: snapshot.language,
            });
          }
        } catch (_) {}
      }
    });

    // 2. Real-Time Chat Message Event
    socket.on('send_message', async ({ interviewId, content }) => {
      if (!interviewId || typeof content !== 'string' || !content.trim()) return;
      if (!socket.userId) return;
      if (!(await isAuthorizedFor(interviewId))) return;

      const roomName = `interview:${interviewId}`;
      const senderId = socket.userId;
      const senderName = socket.userName ?? 'User';
      const sentAt = new Date().toISOString();

      if (isMockStorage()) {
        const mockMessage = {
          id: `msg_${Date.now()}`,
          interviewId,
          senderId,
          senderName,
          content,
          sentAt,
        };
        io.to(roomName).emit('receive_message', mockMessage);
        return;
      }

      try {
        const message = await prisma.message.create({
          data: {
            interviewId,
            senderId,
            senderName,
            content,
          },
        });
        io.to(roomName).emit('receive_message', message);
      } catch (err) {
        console.error('Failed to persist chat message:', err);
        io.to(roomName).emit('receive_message', {
          id: `msg_${Date.now()}`,
          interviewId,
          senderId,
          senderName,
          content,
          sentAt,
        });
      }
    });

    // 3. Collaborative Code Sync Event
    socket.on('code_change', async ({ interviewId, content, language }) => {
      if (!interviewId) return;
      if (!(await isAuthorizedFor(interviewId))) return;
      const roomName = `interview:${interviewId}`;
      socket.to(roomName).emit('code_updated', { content, language });
    });

    // 4. Code Snapshot Save Event
    socket.on('save_snapshot', async ({ interviewId, content, language }) => {
      if (!interviewId) return;
      if (!socket.userId) return;
      if (!(await isAuthorizedFor(interviewId))) return;
      if (isMockStorage()) return;
      try {
        await prisma.codeSnapshot.upsert({
          where: { interviewId },
          create: {
            interviewId,
            content,
            language,
          },
          update: {
            content,
            language,
          },
        });
      } catch (err) {
        console.error('Failed to save code snapshot:', err);
      }
    });

    socket.on('disconnect', () => {
      // Clean up connection
    });
  });

  return io;
}
