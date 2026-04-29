import { randomUUID } from 'node:crypto';
import { sanitizeSensitiveData } from '../security/data-masking.service.js';

export type LogLevel = 'info' | 'sucesso' | 'alerta' | 'erro';

export interface LogEntry {
  id: string;
  level: LogLevel;
  origem: string;
  mensagem: string;
  detalhes?: unknown;
  criadoEm: string;
}

const logs: LogEntry[] = [];

export function addLog(entry: Omit<LogEntry, 'id' | 'criadoEm'>): LogEntry {
  const log = {
    ...entry,
    detalhes: sanitizeSensitiveData(entry.detalhes),
    id: randomUUID(),
    criadoEm: new Date().toISOString()
  };
  logs.push(log);
  return log;
}

export function addAuditLog(entry: Omit<LogEntry, 'id' | 'criadoEm' | 'level'>) {
  return addLog({ level: 'info', ...entry });
}

export function addSecurityLog(origem: string, mensagem: string, detalhes?: unknown) {
  return addLog({ level: 'alerta', origem, mensagem, detalhes });
}

export function addErrorLog(origem: string, mensagem: string, detalhes?: unknown) {
  return addLog({ level: 'erro', origem, mensagem, detalhes });
}

export function listLogs(): LogEntry[] {
  return [...logs].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

export function purgeLogsByUserId(userId: string) {
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
