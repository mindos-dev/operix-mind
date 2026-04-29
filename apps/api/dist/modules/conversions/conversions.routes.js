import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { createConversionJob, listConversionJobs, listConversionMatrix, listConversionOptions, listConversionPlugins } from './conversions.service.js';
export const conversionsRouter = Router();
conversionsRouter.use(authMiddleware);
conversionsRouter.get('/options', (_req, res) => {
    res.json({ dados: listConversionOptions() });
});
conversionsRouter.get('/plugins', (_req, res) => {
    res.json({ dados: listConversionPlugins() });
});
conversionsRouter.get('/matrix', (_req, res) => {
    res.json({ dados: listConversionMatrix() });
});
conversionsRouter.get('/jobs', (req, res) => {
    res.json({ dados: listConversionJobs(req.user.id) });
});
conversionsRouter.post('/jobs', (req, res) => {
    try {
        const optionId = String(req.body?.optionId || '').trim();
        res.status(201).json({ dados: createConversionJob({ userId: req.user.id, optionId }) });
    }
    catch (error) {
        res.status(400).json({ mensagem: error instanceof Error ? error.message : 'Erro ao criar conversão.' });
    }
});
