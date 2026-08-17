// ============================================================
// server.ts — HTTP + Socket.IO Server Bootstrap
// ============================================================

import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { prisma, setIsDbConnected } from './lib/prisma';

async function bootstrap() {
  // 1. Database connection check
  try {
    await prisma.$connect();
    setIsDbConnected(true);
    console.log('✅ PostgreSQL Supabase Database connected successfully!');
  } catch (error: any) {
    setIsDbConnected(false);
    console.warn(`\n⚠️ Database connection warning: Could not connect to PostgreSQL (${error?.message || error}).`);
    console.warn('   Using resilient Mock Mode for offline development.\n');
  }

  // 2. Create Express app
  const app = createApp();
  const server = http.createServer(app);

  // 3. Attach Socket.IO
  const { initSocketServer } = await import('./lib/socket');
  initSocketServer(server);

  // 4. Start listening
  server.listen(env.PORT, () => {
    console.log(`\n🚀 InterviewIQ Backend Server Running`);
    console.log(`   Environment : ${env.NODE_ENV}`);
    console.log(`   Server      : http://localhost:${env.PORT}`);
    console.log(`   Health      : http://localhost:${env.PORT}/health`);
    console.log(`   Socket.IO   : ws://localhost:${env.PORT}\n`);
  });

  // 5. Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed');
    });
    try {
      await prisma.$disconnect();
    } catch (_) {}
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
