import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { aiRouter } from './modules/ai/ai.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { automationsRouter } from './modules/automations/automations.routes.js';
import { ensureDemoUser } from './modules/auth/auth.service.js';
import { conversionsRouter } from './modules/conversions/conversions.routes.js';
import { filesRouter } from './modules/files/files.routes.js';
import { integrationsRouter } from './modules/integrations/integrations.routes.js';
import { logsRouter } from './modules/logs/logs.routes.js';
import { addLog } from './modules/logs/logs.service.js';
import { projectsRouter } from './modules/projects/projects.routes.js';

export function createApp() {
  const app = express();
  ensureDemoUser();

  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json({ limit: '2mb' }));

  app.get('/health', (_req, res) => {
    res.json({
      app: 'Mind_IA API',
      status: 'ok',
      ambiente: env.nodeEnv,
      criadoEm: new Date().toISOString()
    });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/automations', automationsRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/files', filesRouter);
  app.use('/api/conversions', conversionsRouter);
  app.use('/api/integrations', integrationsRouter);
  app.use('/api/logs', logsRouter);

  app.use(errorMiddleware);

  addLog({
    level: 'info',
    origem: 'api',
    mensagem: 'Aplicação Express configurada.'
  });

  return app;
}
