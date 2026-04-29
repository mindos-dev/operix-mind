import { randomUUID } from 'node:crypto';
import { addLog } from '../logs/logs.service.js';
const projects = [];
export function createProject(input) {
    const now = new Date().toISOString();
    const project = {
        id: randomUUID(),
        nome: input.nome.trim(),
        descricao: input.descricao?.trim() || '',
        status: 'rascunho',
        userId: input.userId,
        criadoEm: now,
        atualizadoEm: now
    };
    projects.unshift(project);
    addLog({ level: 'sucesso', origem: 'projects', mensagem: 'Projeto criado.', detalhes: project });
    return project;
}
export function listProjects(userId) {
    return projects.filter((project) => project.userId === userId);
}
export function deleteProjectsByUserId(userId) {
    for (let i = projects.length - 1; i >= 0; i -= 1) {
        if (projects[i].userId === userId) {
            projects.splice(i, 1);
        }
    }
}
export function ensureDemoProject(userId) {
    if (!projects.some((project) => project.userId === userId)) {
        createProject({
            userId,
            nome: 'Sistema de orçamento',
            descricao: 'Projeto inicial para validar o console Mind_IA.'
        });
    }
}
