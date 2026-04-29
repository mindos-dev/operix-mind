import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { listLogs } from './logs.service.js';
export const logsRouter = Router();
logsRouter.use(authMiddleware);
logsRouter.get('/', requirePermission('logs:read'), (_req, res) => {
    res.json({ dados: listLogs() });
});
