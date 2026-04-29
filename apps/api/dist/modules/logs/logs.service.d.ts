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
export declare function listLogs(): LogEntry[];
