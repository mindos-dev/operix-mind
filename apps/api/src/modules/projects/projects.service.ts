import { randomUUID } from 'node:crypto';
import { addLog } from '../logs/logs.service.js';

export interface Project {
  id: string;
  nome: string;
  descricao: string;
  status: 'rascunho' | 'em_execucao' | 'concluido' | 'erro';
  userId: string;
  criadoEm: string;
  atualizadoEm: string;
}

const projects: Project[] = [];

export function createProject(input: { userId: string; nome: string; descricao?: string }) {
  const now = new Date().toISOString();
  const project: Project = {
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

export function listProjects(userId: string) {
  return projects.filter((project) => project.userId === userId);
}

export function deleteProjectsByUserId(userId: string) {
  for (let i = projects.length - 1; i >= 0; i -= 1) {
    if (projects[i].userId === userId) {
      projects.splice(i, 1);
    }
  }
}

export function ensureDemoProject(userId: string) {
  if (!projects.some((project) => project.userId === userId)) {
    createProject({
      userId,
      nome: 'Sistema de orçamento',
      descricao: 'Projeto inicial para validar o console Mind_IA.'
    });
  }
}
