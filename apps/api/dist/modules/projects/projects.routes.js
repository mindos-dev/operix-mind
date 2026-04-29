import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { createProject, listProjects } from './projects.service.js';
export const projectsRouter = Router();
projectsRouter.use(authMiddleware);
projectsRouter.get('/', (req, res) => {
    res.json({ dados: listProjects(req.user.id) });
});
projectsRouter.post('/', (req, res) => {
    const nome = String(req.body?.nome || '').trim();
    const descricao = String(req.body?.descricao || '').trim();
    if (!nome) {
        res.status(400).json({ mensagem: 'Informe o nome do projeto.' });
        return;
    }
    res.status(201).json({ dados: createProject({ userId: req.user.id, nome, descricao }) });
});
