import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { listIntegrations } from './integrations.service.js';

export const integrationsRouter = Router();

integrationsRouter.use(authMiddleware);

integrationsRouter.get('/', (_req, res) => {
  res.json({ dados: listIntegrations() });
});
