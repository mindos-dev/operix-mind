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
    id: randomUUID(),
    criadoEm: new Date().toISOString()
  };
  logs.push(log);
  return log;
}

export function listLogs(): LogEntry[] {
  return [...logs].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}
import { randomUUID } from 'node:crypto';
