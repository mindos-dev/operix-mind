import { randomUUID } from 'node:crypto';
import { sanitizeSensitiveData } from '../security/data-masking.service.js';
const logs = [];
export function addLog(entry) {
    const log = {
        ...entry,
        detalhes: sanitizeSensitiveData(entry.detalhes),
        id: randomUUID(),
        criadoEm: new Date().toISOString()
    };
    logs.push(log);
    return log;
}
export function addAuditLog(entry) {
    return addLog({ level: 'info', ...entry });
}
export function addSecurityLog(origem, mensagem, detalhes) {
    return addLog({ level: 'alerta', origem, mensagem, detalhes });
}
export function addErrorLog(origem, mensagem, detalhes) {
    return addLog({ level: 'erro', origem, mensagem, detalhes });
}
export function listLogs() {
    return [...logs].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}
export function purgeLogsByUserId(userId) {
    let removed = 0;
    for (let i = logs.length - 1; i >= 0; i -= 1) {
        const detalhes = logs[i].detalhes;
        const matches = detalhes && String(detalhes.userId || detalhes.usuarioId || detalhes.sub || '') === userId;
        if (matches) {
            logs.splice(i, 1);
            removed += 1;
        }
    }
    return removed;
}
