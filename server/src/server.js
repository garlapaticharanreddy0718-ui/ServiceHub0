const app = require('./app');
const config = require('./config/env');
const prisma = require('./config/prisma');

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`[ServiceHub Server] Running on http://localhost:${PORT} (${config.nodeEnv})`);
  console.log(`[ServiceHub Server] Health Check: http://localhost:${PORT}/api/v1/health`);
});

let isShuttingDown = false;
const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[ServiceHub Server] ${signal} received. Closing HTTP server and Prisma pool...`);

  server.close(async () => {
    try {
      await prisma.$disconnect();
    } catch (err) {
      console.error('[ServiceHub Server] Error disconnecting Prisma:', err.message);
    } finally {
      process.exit(0);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[ServiceHub Server] Unhandled Promise Rejection:', err?.message || err);
  server.close(async () => {
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[ServiceHub Server] Uncaught Exception:', err?.message || err);
  prisma.$disconnect().catch(() => {}).finally(() => process.exit(1));
});
