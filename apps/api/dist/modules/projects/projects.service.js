import { randomUUID } from 'node:crypto';
import { getPrismaClient, hasDatabase } from '../../db/prisma.js';
import { addLog } from '../logs/logs.service.js';
const projects = [];
export function resetProjectsStore() {
    projects.length = 0;
}
export async function createProject(input) {
    const now = new Date().toISOString();
    const project = {
        id: randomUUID(),
        nome: input.nome.trim(),
        descricao: input.descricao?.trim() || '',
        status: 'rascunho',
        userId: input.userId,
        tenantId: input.tenantId,
        criadoEm: now,
        atualizadoEm: now
    };
    if (hasDatabase()) {
        const prisma = getPrismaClient();
        if (prisma) {
            const row = await prisma.project.create({
                data: {
                    id: project.id,
                    nome: project.nome,
                    descricao: project.descricao,
                    status: project.status,
                    userId: project.userId,
                    tenantId: project.tenantId,
                    criadoEm: new Date(project.criadoEm),
                    atualizadoEm: new Date(project.atualizadoEm)
                }
            });
            const saved = {
                id: row.id,
                nome: row.nome,
                descricao: row.descricao,
                status: row.status,
                userId: row.userId,
                tenantId: row.tenantId,
                criadoEm: row.criadoEm.toISOString(),
                atualizadoEm: row.atualizadoEm.toISOString()
            };
            await addLog({ level: 'sucesso', origem: 'projects', mensagem: 'Projeto criado.', detalhes: saved, tenantId: project.tenantId, userId: project.userId });
            return saved;
        }
    }
    projects.unshift(project);
    await addLog({ level: 'sucesso', origem: 'projects', mensagem: 'Projeto criado.', detalhes: project, tenantId: project.tenantId, userId: project.userId });
    return project;
}
export async function listProjects(tenantId) {
    if (hasDatabase()) {
        const prisma = getPrismaClient();
        if (prisma) {
            const rows = await prisma.project.findMany({
                where: { tenantId },
                orderBy: { criadoEm: 'desc' }
            });
            return rows.map((row) => ({
                id: row.id,
                nome: row.nome,
                descricao: row.descricao,
                status: row.status,
                userId: row.userId,
                tenantId: row.tenantId,
                criadoEm: row.criadoEm.toISOString(),
                atualizadoEm: row.atualizadoEm.toISOString()
            }));
        }
    }
    return projects.filter((project) => project.tenantId === tenantId);
}
export async function deleteProjectsByTenantId(tenantId) {
    if (hasDatabase()) {
        const prisma = getPrismaClient();
        if (prisma) {
            await prisma.project.deleteMany({ where: { tenantId } });
            return;
        }
    }
    for (let i = projects.length - 1; i >= 0; i -= 1) {
        if (projects[i].tenantId === tenantId) {
            projects.splice(i, 1);
        }
    }
}
export async function ensureDemoProject(userId, tenantId) {
    const existing = await listProjects(tenantId);
    if (existing.length > 0)
        return;
    await createProject({
        userId,
        tenantId,
        nome: 'Sistema de orçamento',
        descricao: 'Projeto inicial para validar o console Mind_IA.'
    });
}
