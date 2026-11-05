const app = require('./app');
const config = require('./config/env');

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`[ServiceHub Server] Running on http://localhost:${PORT} (${config.nodeEnv})`);
  console.log(`[ServiceHub Server] Health Check: http://localhost:${PORT}/api/v1/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[ServiceHub Server] Unhandled Promise Rejection:', err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[ServiceHub Server] Uncaught Exception:', err);
  process.exit(1);
});
