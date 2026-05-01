import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { createProject, listProjects } from './projects.service.js';
export const projectsRouter = Router();
projectsRouter.use(authMiddleware);
projectsRouter.get('/', (req, res) => {
    Promise.resolve(listProjects(req.user.tenantId))
        .then((dados) => res.json({ dados }))
        .catch((error) => res.status(500).json({ mensagem: error instanceof Error ? error.message : 'Erro ao listar projetos.' }));
});
projectsRouter.post('/', (req, res) => {
    const nome = String(req.body?.nome || '').trim();
    const descricao = String(req.body?.descricao || '').trim();
    if (!nome) {
        res.status(400).json({ mensagem: 'Informe o nome do projeto.' });
        return;
    }
    Promise.resolve(createProject({ userId: req.user.id, tenantId: req.user.tenantId, nome, descricao }))
        .then((dados) => res.status(201).json({ dados }))
        .catch((error) => res.status(400).json({ mensagem: error instanceof Error ? error.message : 'Erro ao criar projeto.' }));
});
