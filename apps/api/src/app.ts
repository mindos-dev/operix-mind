import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import { hasDatabase } from './db/prisma.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { requestLoggerMiddleware } from './middleware/request-logger.middleware.js';
import { requireSecureOrigin } from './modules/security/security.guard.js';

// Importar roteadores
import { aiRouter } from './modules/ai/ai.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { automationsRouter } from './modules/automations/automations.routes.js';
import { bridgeRouter } from './modules/integrations/bridge/bridge.routes.js';
import { conversionsRouter } from './modules/conversions/conversions.routes.js';
import { documentsRouter } from './modules/documents/documents.routes.js';
import { filesRouter } from './modules/files/files.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { integrationsRouter } from './modules/integrations/integrations.routes.js';
import { logsRouter } from './modules/logs/logs.routes.js';
import { observabilityRouter } from './modules/observability/observability.routes.js';
import { privacyRouter } from './modules/privacy/privacy.routes.js';
import { projectsRouter } from './modules/projects/projects.routes.js';
import { setupRouter } from './modules/setup/setup.routes.js';
import { telegramRouter } from './modules/telegram/telegram.routes.js';

import { ensureBootstrapAdmin, ensureDemoUser } from './modules/auth/auth.service.js';

export const createApp = async () => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: env.corsOrigin?.split(',') || true,
    credentials: true,
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Muitas requisições deste IP, tente novamente mais tarde.',
  });
  app.use('/api', limiter);

  // Body parsing
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(cookieParser());

  // Logging
  app.use(requestLoggerMiddleware);

  // Additional security in production
  if (env.nodeEnv === 'production') {
    app.use(requireSecureOrigin);
  }

  // Health routes (no auth)
  app.use('/health', healthRouter);
  app.use('/api/health', healthRouter);

  // Setup routes (first-time setup)
  app.use('/setup', setupRouter);
  app.use('/api/setup', setupRouter);

  // Main API routes
  app.use('/api/auth', authRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/files', filesRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/conversions', conversionsRouter);
  app.use('/api/documents', documentsRouter);
  app.use('/api/integrations', integrationsRouter);
  app.use('/api/integrations/bridge', bridgeRouter);
  app.use('/api/logs', logsRouter);
  app.use('/api/observability', observabilityRouter);
  app.use('/api/privacy', privacyRouter);
  app.use('/api/telegram', telegramRouter);
  app.use('/api/automations', automationsRouter);

  // Initialize database on first request
  let initialized = false;
  const initializeApp = async () => {
    if (initialized) return;
    try {
      if (hasDatabase()) {
        await ensureBootstrapAdmin();
        await ensureDemoUser();
        console.log('[App] Database initialized');
      }
      initialized = true;
    } catch (error) {
      console.error('[App] Init error:', error);
    }
  };

  app.use(async (req, res, next) => {
    await initializeApp();
    next();
  });

  // Root route
  app.get('/', (req, res) => {
    res.json({
      name: 'OPERIX Mind API',
      version: '1.0.0',
      status: 'operational',
      endpoints: {
        health: '/health',
        setup: '/setup',
        api: '/api',
      },
    });
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
  });

  // Error handler (must be last)
  app.use(errorMiddleware);

  return app;
};
