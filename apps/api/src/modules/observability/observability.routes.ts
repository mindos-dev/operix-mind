import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { getObservabilitySnapshot } from './observability.service.js';

export const observabilityRouter = Router();

observabilityRouter.use(authMiddleware);

observabilityRouter.get('/metrics', requirePermission('security:read'), (_req, res) => {
  res.json({ dados: getObservabilitySnapshot() });
});

observabilityRouter.get('/status', requirePermission('security:read'), (_req, res) => {
  res.json({
    dados: {
      status: 'ok',
      servico: 'Mind_IA API',
      ambiente: process.env.NODE_ENV || 'development'
    }
  });
});
