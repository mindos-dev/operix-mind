import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { listAutomationFlows, runAutomation } from './automations.service.js';

export const automationsRouter = Router();

automationsRouter.use(authMiddleware);

automationsRouter.get('/flows', (_req, res) => {
  res.json({ dados: listAutomationFlows() });
});

automationsRouter.post('/run', (req, res) => {
  try {
    const flowId = String(req.body?.flowId || '').trim();
    const texto = String(req.body?.texto || '').trim();
    res.status(201).json({ dados: runAutomation({ userId: req.user!.id, flowId, texto }) });
  } catch (error) {
    res.status(400).json({ mensagem: error instanceof Error ? error.message : 'Erro ao executar automação.' });
  }
});
