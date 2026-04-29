export type LogLevel = 'info' | 'sucesso' | 'alerta' | 'erro';
export interface LogEntry {
    id: string;
    level: LogLevel;
    origem: string;
    mensagem: string;
    detalhes?: unknown;
    criadoEm: string;
}
export declare function addLog(entry: Omit<LogEntry, 'id' | 'criadoEm'>): LogEntry;
export declare function addAuditLog(entry: Omit<LogEntry, 'id' | 'criadoEm' | 'level'>): LogEntry;
export declare function addSecurityLog(origem: string, mensagem: string, detalhes?: unknown): LogEntry;
export declare function addErrorLog(origem: string, mensagem: string, detalhes?: unknown): LogEntry;
export declare function listLogs(): LogEntry[];
export declare function purgeLogsByUserId(userId: string): number;
