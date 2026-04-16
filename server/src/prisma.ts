import { PrismaClient } from '@prisma/client';

// Vercel Postgres injects POSTGRES_PRISMA_URL / POSTGRES_URL_NON_POOLING.
// Map them to the names Prisma expects if DATABASE_URL isn't set.
if (!process.env.DATABASE_URL && process.env.POSTGRES_PRISMA_URL) {
  process.env.DATABASE_URL = process.env.POSTGRES_PRISMA_URL;
}
if (!process.env.DIRECT_DATABASE_URL && process.env.POSTGRES_URL_NON_POOLING) {
  process.env.DIRECT_DATABASE_URL = process.env.POSTGRES_URL_NON_POOLING;
}

// In serverless environments, prevent multiple Prisma instances
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
