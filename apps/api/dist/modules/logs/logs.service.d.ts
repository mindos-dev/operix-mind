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
export declare function resetLogsStore(): void;
export declare function addLog(entry: Omit<LogEntry, 'id' | 'criadoEm'>): Promise<LogEntry>;
export declare function addAuditLog(entry: Omit<LogEntry, 'id' | 'criadoEm' | 'level'>): Promise<LogEntry>;
export declare function addSecurityLog(origem: string, mensagem: string, detalhes?: unknown, tenantId?: string, userId?: string): Promise<LogEntry>;
export declare function addErrorLog(origem: string, mensagem: string, detalhes?: unknown, tenantId?: string, userId?: string): Promise<LogEntry>;
export declare function listLogs(): Promise<LogEntry[]>;
export declare function purgeLogsByUserId(userId: string): Promise<number>;
