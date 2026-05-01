import { Router } from 'express';
import { getAwsHealth } from '../aws/aws-health.service.js';
import { hasDatabase } from '../../db/prisma.js';
import { config } from '../../config/config.service.js';
import { getObservabilitySnapshot } from '../observability/observability.service.js';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({
    app: 'Mind_IA API',
    status: 'ok',
    version: '1.0.0',
    ambiente: config.nodeEnv,
    criadoEm: new Date().toISOString()
  });
});

healthRouter.get('/health/liveness', (_req, res) => {
  res.json({ ok: true, status: 'alive' });
});

healthRouter.get('/health/readiness', (_req, res) => {
  res.json({
    ok: true,
    database: hasDatabase() ? 'connected' : 'not_configured',
    storage: config.storage.driver,
    telegram: config.appPublicUrl ? 'configured' : 'not_configured'
  });
});

healthRouter.get('/health/full', async (_req, res) => {
  const aws = await getAwsHealth();
  const observability = getObservabilitySnapshot();
  res.json({
    ok: true,
    app: 'Mind_IA API',
    version: '1.0.0',
    uptime: process.uptime(),
    database: hasDatabase() ? 'connected' : 'not_configured',
    storage: {
      driver: config.storage.driver,
      localDir: config.storage.localDir
    },
    aws,
    telegram: {
      configured: Boolean(config.appPublicUrl)
    },
    observability,
    env: config.getPublicConfig()
  });
});
