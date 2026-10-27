// ============================================================
// server.ts — HTTP + Socket.IO Server Bootstrap
// ============================================================

import dns from 'node:dns';
dns.setDefaultResultOrder('verbatim');

import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { prisma, checkDbConnection } from './lib/prisma';
import { startLifecycleSchedulers } from './lib/schedulers';

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function bootstrap() {
  // The selected storage mode is fixed for this process. A database outage
  // must never switch repositories to sample data midway through a session.
  const dbConnected = env.STORAGE_MODE === 'database' ? await checkDbConnection() : false;

  if (env.STORAGE_MODE === 'database' && !dbConnected) {
    console.error('❌ STORAGE_MODE is "database", but PostgreSQL is unreachable. Refusing to start.');
    process.exit(1);
  }

  if (env.STORAGE_MODE === 'database') {
    console.log('✅ PostgreSQL Supabase Database connected successfully!');
  } else {
    console.warn(
      `\n⚠️ STORAGE_MODE is "memory". This process will use in-memory demo data.`,
    );
    console.warn('   Database connectivity will not change the selected storage mode.\n');
  }

  // 2. Create Express app
  const app = createApp();
  const server = http.createServer(app);

  // 3. Attach Socket.IO
  const { initSocketServer } = await import('./lib/socket');
  const io = initSocketServer(server);

  // 4. Booking lifecycle scheduler (PENDING TTL expiry, completions, no-shows)
  const scheduler = startLifecycleSchedulers();

  // 6. Start listening
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
    scheduler.stop();

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
