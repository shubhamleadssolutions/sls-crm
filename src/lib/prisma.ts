import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Use Supabase Transaction Pooler (port 6543) with pgbouncer and bounded connection limit to prevent EMAXCONNSESSION
const rawDbUrl =
  process.env.DATABASE_URL ||
  'postgresql://postgres.fjdxhkaqnvvaownnjgkx:Shubham3569@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5';

const normalizedDbUrl = rawDbUrl.includes(':5432/')
  ? rawDbUrl.replace(':5432/', ':6543/').concat(rawDbUrl.includes('?') ? '&pgbouncer=true&connection_limit=5' : '?pgbouncer=true&connection_limit=5')
  : rawDbUrl;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: normalizedDbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// Always retain singleton instance in all environments to prevent connection pool exhaustion
globalForPrisma.prisma = prisma;
