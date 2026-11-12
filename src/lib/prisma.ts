import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const DEFAULT_DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:Shubham3569@db.fjdxhkaqnvvaownnjgkx.supabase.co:5432/postgres';

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: DEFAULT_DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
