// ============================================================
// socket.ts — Real-Time WebSocket Server (Socket.io)
//
// WHY: Enables real-time chat messaging and collaborative code
// sync between candidates and interviewers during live sessions.
// ============================================================

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { env } from '../config/env';
import { prisma, isDbConnected } from './prisma';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
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

  io.on('connection', (socket: AuthenticatedSocket) => {
    // 1. Join Interview Room
    socket.on('join_room', async ({ interviewId, userId, userName }) => {
      socket.userId = userId;
      socket.userName = userName;
      const roomName = `interview:${interviewId}`;
      socket.join(roomName);
      socket.to(roomName).emit('user_joined', { userId, userName });

      // Fetch latest code snapshot if available
      if (isDbConnected()) {
        try {
          const snapshot = await prisma.codeSnapshot.findUnique({ where: { interviewId } });
          if (snapshot) {
            socket.emit('code_updated', { content: snapshot.content, language: snapshot.language });
          }
        } catch (_) {}
      }
    });

    // 2. Real-Time Chat Message Event
    socket.on('send_message', async ({ interviewId, content, senderId, senderName }) => {
      const roomName = `interview:${interviewId}`;
      const sentAt = new Date().toISOString();

      if (!isDbConnected()) {
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
    socket.on('code_change', ({ interviewId, content, language }) => {
      const roomName = `interview:${interviewId}`;
      socket.to(roomName).emit('code_updated', { content, language });
    });

    // 4. Code Snapshot Save Event
    socket.on('save_snapshot', async ({ interviewId, content, language }) => {
      if (!isDbConnected()) return;
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
