import { getPrismaClient, hasDatabase } from '../../db/prisma.js';
import { addAuditLog } from '../logs/logs.service.js';

export type ConsentScope = 'processing' | 'ai_assistance' | 'storage' | 'analytics' | 'marketing';

export interface ConsentRecord {
  userId: string;
  tenantId: string;
  scope: ConsentScope;
  accepted: boolean;
  acceptedAt: string;
  version: string;
}

const consents = new Map<string, ConsentRecord[]>();

export function resetConsentsStore() {
  consents.clear();
}

export function requestConsent(scope: ConsentScope, version = '1.0') {
  return {
    scope,
    version,
    required: true,
    message: 'O uso deste recurso depende de consentimento registrado.'
  };
}

export async function recordConsent(userId: string, tenantId: string, scope: ConsentScope, accepted: boolean, version = '1.0') {
  const entry: ConsentRecord = {
    userId,
    tenantId,
    scope,
    accepted,
    acceptedAt: new Date().toISOString(),
    version
  };

  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.consentRecord.create({
        data: {
          userId,
          tenantId,
          scope,
          accepted,
          version,
          acceptedAt: new Date(entry.acceptedAt)
        }
      });
    }
  } else {
    const current = consents.get(tenantId) || [];
    current.unshift(entry);
    consents.set(tenantId, current);
  }

  await addAuditLog({
    origem: 'privacy',
    mensagem: accepted ? 'Consentimento registrado.' : 'Consentimento recusado.',
    detalhes: { userId, tenantId, scope, accepted, version },
    tenantId,
    userId
  });

  return entry;
}

export async function hasConsent(userId: string, tenantId: string, scope: ConsentScope) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      const record = await prisma.consentRecord.findFirst({
        where: { userId, tenantId, scope, accepted: true },
        orderBy: { acceptedAt: 'desc' }
      });
      return Boolean(record);
    }
  }

  return (consents.get(tenantId) || []).some((record) => record.userId === userId && record.scope === scope && record.accepted);
}

export async function listConsents(tenantId: string) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      const rows = await prisma.consentRecord.findMany({
        where: { tenantId },
        orderBy: { acceptedAt: 'desc' }
      });
      return rows.map((row) => ({
        userId: row.userId,
        tenantId: row.tenantId,
        scope: row.scope as ConsentScope,
        accepted: row.accepted,
        acceptedAt: row.acceptedAt.toISOString(),
        version: row.version
      }));
    }
  }

  return [...(consents.get(tenantId) || [])];
}

export async function deleteConsents(tenantId: string) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.consentRecord.deleteMany({ where: { tenantId } });
      return;
    }
  }

  consents.delete(tenantId);
}
