const logs = [];
export function addLog(entry) {
    const log = {
        ...entry,
        id: randomUUID(),
        criadoEm: new Date().toISOString()
    };
    logs.push(log);
    return log;
}
export function listLogs() {
    return [...logs].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}
import { randomUUID } from 'node:crypto';
