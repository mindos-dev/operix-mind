import { Router } from 'express';
import { listLogs } from './logs.service.js';
export const logsRouter = Router();
logsRouter.get('/', (_req, res) => {
    res.json({ dados: listLogs() });
});
