// ============================================================
// server.ts — HTTP + Socket.IO Server Bootstrap
// ============================================================

import dns from 'node:dns';
dns.setDefaultResultOrder('verbatim');

import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { prisma, checkDbConnection } from './lib/prisma';

const DB_PING_INTERVAL_MS = 30_000;
const SHUTDOWN_TIMEOUT_MS = 10_000;

async function bootstrap() {
  // 1. Database connection check
  const dbConnected = await checkDbConnection();

  if (dbConnected) {
    console.log('✅ PostgreSQL Supabase Database connected successfully!');
  } else if (env.NODE_ENV === 'production') {
    // Serving fake data in production would mask outages as success — fail fast.
    console.error('❌ Database unreachable in production. Refusing to start.');
    process.exit(1);
  } else {
    console.warn(
      `\n⚠️ Database connection warning: Could not connect to PostgreSQL.`,
    );
    console.warn('   Using resilient Mock Mode for offline development.\n');
  }

  // 2. Create Express app
  const app = createApp();
  const server = http.createServer(app);

  // 3. Attach Socket.IO
  const { initSocketServer } = await import('./lib/socket');
  const io = initSocketServer(server);

  // 4. Keep the DB connection flag fresh (dev resilience only)
  const dbPingTimer =
    env.NODE_ENV !== 'production'
      ? setInterval(() => void checkDbConnection(), DB_PING_INTERVAL_MS)
      : null;

  // 5. Start listening
  server.listen(env.PORT, () => {
    console.log(`\n🚀 InterviewIQ Backend Server Running`);
    console.log(`   Environment : ${env.NODE_ENV}`);
    console.log(`   Server      : http://localhost:${env.PORT}`);
    console.log(`   Health      : http://localhost:${env.PORT}/health`);
    console.log(`   Socket.IO   : ws://localhost:${env.PORT}\n`);
  });

  // 6. Graceful shutdown
  let isShuttingDown = false;
  const shutdown = async (signal: string, exitCode: number) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\n${signal} received. Shutting down gracefully...`);
    if (dbPingTimer) clearInterval(dbPingTimer);

    // Stop accepting new connections (HTTP + WebSocket), then drain
    io.close();
    const forceExit = setTimeout(() => {
      console.error('Forcing shutdown after timeout.');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);

    try {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
      await prisma.$disconnect();
      clearTimeout(forceExit);
      console.log('Shutdown complete.');
      process.exit(exitCode);
    } catch (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM', 0));
  process.on('SIGINT', () => void shutdown('SIGINT', 0));
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection:', reason);
  });
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    void shutdown('UNCAUGHT_EXCEPTION', 1);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
