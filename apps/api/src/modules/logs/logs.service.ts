import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { getPrismaClient, hasDatabase } from '../../db/prisma.js';
import { sanitizeSensitiveData } from '../security/data-masking.service.js';

export type LogLevel = 'info' | 'sucesso' | 'alerta' | 'erro';

export interface LogEntry {
  id: string;
  level: LogLevel;
  origem: string;
  mensagem: string;
  detalhes?: unknown;
  criadoEm: string;
  tenantId?: string;
  userId?: string;
}

const logs: LogEntry[] = [];

export function resetLogsStore() {
  logs.length = 0;
}

export async function addLog(entry: Omit<LogEntry, 'id' | 'criadoEm'>): Promise<LogEntry> {
  const log: LogEntry = {
    ...entry,
    detalhes: sanitizeSensitiveData(entry.detalhes),
    id: randomUUID(),
    criadoEm: new Date().toISOString()
  };

  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.auditLog.create({
        data: {
          id: log.id,
          level: log.level,
          origem: log.origem,
          mensagem: log.mensagem,
          detalhes: log.detalhes === undefined ? undefined : (log.detalhes as any),
          tenantId: entry.tenantId || null,
          userId: entry.userId || null,
          criadoEm: new Date(log.criadoEm)
        }
      });
      return log;
    }
  }

  logs.push(log);
  return log;
}

export async function addAuditLog(entry: Omit<LogEntry, 'id' | 'criadoEm' | 'level'>) {
  return addLog({ level: 'info', ...entry });
}

export async function addSecurityLog(origem: string, mensagem: string, detalhes?: unknown, tenantId?: string, userId?: string) {
  const entry = await addLog({ level: 'alerta', origem, mensagem, detalhes, tenantId, userId });
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.securityLog.create({
        data: {
          id: entry.id,
          origem,
          mensagem,
          detalhes: entry.detalhes === undefined ? undefined : (entry.detalhes as any),
          tenantId: tenantId || null,
          userId: userId || null,
          criadoEm: new Date(entry.criadoEm)
        }
      });
    }
  }
  return entry;
}

export async function addErrorLog(origem: string, mensagem: string, detalhes?: unknown, tenantId?: string, userId?: string) {
  return addLog({ level: 'erro', origem, mensagem, detalhes, tenantId, userId });
}

export async function listLogs(): Promise<LogEntry[]> {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      const rows = await prisma.auditLog.findMany({
        orderBy: { criadoEm: 'desc' },
        take: 200
      });

      return rows.map((row) => ({
        id: row.id,
        level: row.level as LogLevel,
        origem: row.origem,
        mensagem: row.mensagem,
        detalhes: row.detalhes ?? undefined,
        criadoEm: row.criadoEm.toISOString(),
        tenantId: row.tenantId || undefined,
        userId: row.userId || undefined
      }));
    }
  }

  return [...logs].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

export async function purgeLogsByUserId(userId: string) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (!prisma) return 0;
    const removed = await prisma.auditLog.deleteMany({ where: { userId } });
    return removed.count;
  }

  let removed = 0;
  for (let i = logs.length - 1; i >= 0; i -= 1) {
    const detalhes = logs[i].detalhes as Record<string, unknown> | undefined;
    const matches = detalhes && String(detalhes.userId || detalhes.usuarioId || detalhes.sub || '') === userId;
    if (matches) {
      logs.splice(i, 1);
      removed += 1;
    }
  }
  return removed;
}
