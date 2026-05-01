import { PrismaClient } from '@prisma/client';
import { config } from '../config/config.service.js';

let prisma: PrismaClient | null = null;

export function hasDatabase(): boolean {
  return Boolean(config.databaseUrl);
}

export function getPrismaClient(): PrismaClient | null {
  if (!hasDatabase()) {
    return null;
  }

  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: config.databaseUrl
        }
      }
    });
  }

  return prisma;
}

export async function disconnectPrisma() {
  if (!prisma) return;
  const current = prisma;
  prisma = null;
  await current.$disconnect();
}
