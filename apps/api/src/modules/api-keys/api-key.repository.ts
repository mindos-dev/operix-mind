import { randomUUID, createHash } from 'node:crypto';
import { getPrismaClient, hasDatabase } from '../../db/prisma.js';
import type { ApiKeyRecord } from './api-key.types.js';

const memoryKeys = new Map<string, ApiKeyRecord>();

export function resetApiKeyStore() {
  memoryKeys.clear();
}

function rowToRecord(row: any): ApiKeyRecord {
  return {
    id: row.id,
    keyPrefix: row.keyPrefix,
    keyHash: row.keyHash,
    name: row.name,
    scopes: Array.isArray(row.scopes) ? row.scopes : [],
    tenantId: row.tenantId,
    userId: row.userId,
    status: row.status,
    expiresAt: row.expiresAt ? new Date(row.expiresAt).toISOString() : undefined,
    lastUsedAt: row.lastUsedAt ? new Date(row.lastUsedAt).toISOString() : undefined,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString()
  };
}

export async function saveApiKey(record: ApiKeyRecord) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.apiKey.upsert({
        where: { id: record.id },
        update: {
          keyPrefix: record.keyPrefix,
          keyHash: record.keyHash,
          name: record.name,
          scopes: record.scopes,
          tenantId: record.tenantId,
          userId: record.userId,
          status: record.status,
          expiresAt: record.expiresAt ? new Date(record.expiresAt) : null,
          lastUsedAt: record.lastUsedAt ? new Date(record.lastUsedAt) : null
        },
        create: {
          id: record.id,
          keyPrefix: record.keyPrefix,
          keyHash: record.keyHash,
          name: record.name,
          scopes: record.scopes,
          tenantId: record.tenantId,
          userId: record.userId,
          status: record.status,
          expiresAt: record.expiresAt ? new Date(record.expiresAt) : null,
          lastUsedAt: record.lastUsedAt ? new Date(record.lastUsedAt) : null
        }
      });
    }
    return record;
  }

  memoryKeys.set(record.id, record);
  return record;
}

export async function createApiKeyRecord(input: Omit<ApiKeyRecord, 'id' | 'createdAt' | 'updatedAt'>) {
  const record: ApiKeyRecord = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  return saveApiKey(record);
}

export async function listApiKeysByTenant(tenantId: string) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      const rows = await prisma.apiKey.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' }
      });
      return rows.map(rowToRecord);
    }
  }

  return [...memoryKeys.values()].filter((key) => key.tenantId === tenantId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getApiKeyById(id: string) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      const row = await prisma.apiKey.findUnique({ where: { id } });
      return row ? rowToRecord(row) : null;
    }
  }

  return memoryKeys.get(id) || null;
}

export async function getApiKeyByPrefix(keyPrefix: string) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      const row = await prisma.apiKey.findFirst({ where: { keyPrefix } });
      return row ? rowToRecord(row) : null;
    }
  }

  return [...memoryKeys.values()].find((key) => key.keyPrefix === keyPrefix) || null;
}

export async function markApiKeyUsed(id: string) {
  const record = await getApiKeyById(id);
  if (!record) return null;
  const updated = { ...record, lastUsedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  return saveApiKey(updated);
}

export async function revokeApiKey(id: string) {
  const record = await getApiKeyById(id);
  if (!record) return null;
  const updated = { ...record, status: 'revoked' as const, updatedAt: new Date().toISOString() };
  return saveApiKey(updated);
}

export function hashApiKeyValue(value: string) {
  return createHash('sha256').update(value).digest('hex');
}
