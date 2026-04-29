import { randomUUID } from 'node:crypto';
import { addLog } from '../logs/logs.service.js';
const files = [];
export function createFileRecord(input) {
    const extension = input.nomeOriginal.includes('.') ? input.nomeOriginal.split('.').pop() || 'desconhecido' : 'desconhecido';
    const file = {
        id: randomUUID(),
        nomeOriginal: input.nomeOriginal,
        nomeArmazenado: input.nomeArmazenado,
        formato: extension.toLowerCase(),
        tamanhoBytes: input.tamanhoBytes,
        caminho: input.caminho,
        mimetype: input.mimetype,
        status: 'recebido',
        userId: input.userId,
        criadoEm: new Date().toISOString()
    };
    files.unshift(file);
    addLog({ level: 'sucesso', origem: 'files', mensagem: 'Arquivo registrado em modo local.', detalhes: file });
    return file;
}
export function listFiles(userId) {
    return files.filter((file) => file.userId === userId);
}
export function deleteFilesByUserId(userId) {
    for (let i = files.length - 1; i >= 0; i -= 1) {
        if (files[i].userId === userId) {
            files.splice(i, 1);
        }
    }
}
