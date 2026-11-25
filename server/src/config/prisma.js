const { PrismaClient } = require('@prisma/client');
const config = require('./env');

/**
 * Shared PrismaClient singleton to prevent connection pool exhaustion
 * across controllers, services, and middlewares.
 */
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.__servicehubPrisma ||
  new PrismaClient({
    log: config.nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
  });

if (config.nodeEnv !== 'production') {
  globalForPrisma.__servicehubPrisma = prisma;
}

module.exports = prisma;

