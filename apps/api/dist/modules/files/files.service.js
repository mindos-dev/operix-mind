import { randomUUID } from 'node:crypto';
import { getPrismaClient, hasDatabase } from '../../db/prisma.js';
import { addLog } from '../logs/logs.service.js';
import { saveFile } from '../storage/storage.service.js';
const files = [];
export function resetFilesStore() {
    files.length = 0;
}
export async function createFileRecord(input) {
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
        tenantId: input.tenantId,
        criadoEm: new Date().toISOString()
    };
    if (hasDatabase()) {
        const prisma = getPrismaClient();
        if (prisma) {
            const row = await prisma.fileAsset.create({
                data: {
                    id: file.id,
                    nomeOriginal: file.nomeOriginal,
                    formato: file.formato,
                    tamanhoBytes: file.tamanhoBytes,
                    caminho: file.caminho || '',
                    status: file.status,
                    projectId: null,
                    userId: file.userId,
                    tenantId: file.tenantId,
                    criadoEm: new Date(file.criadoEm)
                }
            });
            const saved = {
                ...file,
                id: row.id,
                criadoEm: row.criadoEm.toISOString()
            };
            await addLog({ level: 'sucesso', origem: 'files', mensagem: 'Arquivo registrado em modo persistente.', detalhes: saved, tenantId: file.tenantId, userId: file.userId });
            return saved;
        }
    }
    files.unshift(file);
    await addLog({ level: 'sucesso', origem: 'files', mensagem: 'Arquivo registrado em modo local.', detalhes: file, tenantId: file.tenantId, userId: file.userId });
    return file;
}
export function persistUploadedFile(input) {
    return saveFile({
        tenantId: input.tenantId,
        userId: input.userId,
        sourcePath: input.sourcePath,
        filename: input.originalName
    }).then((stored) => ({
        nomeArmazenado: stored.key.split('/').pop() || sanitizeFilename(input.originalName),
        caminho: stored.path
    }));
}
export async function listFiles(tenantId) {
    if (hasDatabase()) {
        const prisma = getPrismaClient();
        if (prisma) {
            const rows = await prisma.fileAsset.findMany({
                where: { tenantId },
                orderBy: { criadoEm: 'desc' }
            });
            return rows.map((row) => ({
                id: row.id,
                nomeOriginal: row.nomeOriginal,
                formato: row.formato,
                tamanhoBytes: row.tamanhoBytes,
                caminho: row.caminho || undefined,
                status: row.status,
                userId: row.userId,
                tenantId: row.tenantId,
                criadoEm: row.criadoEm.toISOString()
            }));
        }
    }
    return files.filter((file) => file.tenantId === tenantId);
}
export async function getFileRecord(tenantId, fileId) {
    if (hasDatabase()) {
        const prisma = getPrismaClient();
        if (prisma) {
            const row = await prisma.fileAsset.findFirst({
                where: { id: fileId, tenantId }
            });
            if (!row)
                return null;
            return {
                id: row.id,
                nomeOriginal: row.nomeOriginal,
                formato: row.formato,
                tamanhoBytes: row.tamanhoBytes,
                caminho: row.caminho || undefined,
                status: row.status,
                userId: row.userId,
                tenantId: row.tenantId,
                criadoEm: row.criadoEm.toISOString()
            };
        }
    }
    return files.find((file) => file.id === fileId && file.tenantId === tenantId) || null;
}
export async function deleteFilesByTenantId(tenantId) {
    if (hasDatabase()) {
        const prisma = getPrismaClient();
        if (prisma) {
            await prisma.fileAsset.deleteMany({ where: { tenantId } });
            return;
        }
    }
    for (let i = files.length - 1; i >= 0; i -= 1) {
        if (files[i].tenantId === tenantId) {
            files.splice(i, 1);
        }
    }
}
function sanitizeFilename(filename) {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180);
}
