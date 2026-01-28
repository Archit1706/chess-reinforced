import { PrismaClient } from '@prisma/client';

// Declare global type for Prisma client to prevent multiple instances in development
declare global {
  var prisma: PrismaClient | undefined;
}

// Create a single instance of Prisma Client
// In development, we reuse the client across hot reloads
export const prisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;
