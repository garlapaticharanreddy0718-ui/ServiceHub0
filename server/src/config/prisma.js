const { PrismaClient } = require('@prisma/client');
const config = require('./env');

const DEFAULT_CONNECTION_LIMIT = process.env.PRISMA_CONNECTION_LIMIT || '5';
const DEFAULT_POOL_TIMEOUT = process.env.PRISMA_POOL_TIMEOUT || '20';

/**
 * Ensure DATABASE_URL carries a bounded connection_limit and pool_timeout
 * when not explicitly configured, preventing Prisma from exhausting
 * Supabase Session Mode pool_size (15) under concurrent queries.
 * Never logs or exposes the connection string.
 */
const buildPooledDatabaseUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;

  try {
    const parsed = new URL(rawUrl);
    if (!parsed.searchParams.has('connection_limit')) {
      parsed.searchParams.set('connection_limit', DEFAULT_CONNECTION_LIMIT);
    }
    if (!parsed.searchParams.has('pool_timeout')) {
      parsed.searchParams.set('pool_timeout', DEFAULT_POOL_TIMEOUT);
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
};

/**
 * Shared PrismaClient singleton to prevent connection pool exhaustion
 * across controllers, services, and middlewares.
 */
const globalForPrisma = globalThis;

const pooledUrl = buildPooledDatabaseUrl(config.databaseUrl);

const prisma =
  globalForPrisma.__servicehubPrisma ||
  new PrismaClient({
    ...(pooledUrl ? { datasources: { db: { url: pooledUrl } } } : {}),
    log: config.nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
  });

globalForPrisma.__servicehubPrisma = prisma;

module.exports = prisma;

