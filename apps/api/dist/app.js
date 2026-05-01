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
import { aiRouter } from './modules/ai/ai.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { automationsRouter } from './modules/automations/automations.routes.js';
import { ensureBootstrapAdmin, ensureDemoUser, resetAuthStore } from './modules/auth/auth.service.js';
import { conversionsRouter } from './modules/conversions/conversions.routes.js';
import { apiKeyRouter } from './modules/api-keys/api-key.routes.js';
import { documentsRouter } from './modules/documents/documents.routes.js';
import { filesRouter } from './modules/files/files.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { integrationsRouter } from './modules/integrations/integrations.routes.js';
import { telegramRouter, telegramStatusRouter, telegramWebhookRouter } from './modules/telegram/telegram.routes.js';
import { logsRouter } from './modules/logs/logs.routes.js';
import { addAuditLog, resetLogsStore } from './modules/logs/logs.service.js';
import { observabilityRouter } from './modules/observability/observability.routes.js';
import { privacyRouter } from './modules/privacy/privacy.routes.js';
import { resetConsentsStore } from './modules/privacy/consent.service.js';
import { projectsRouter } from './modules/projects/projects.routes.js';
import { setupRouter } from './modules/setup/setup.routes.js';
import { resetFilesStore } from './modules/files/files.service.js';
import { resetProjectsStore } from './modules/projects/projects.service.js';
import { resetApiKeyStore } from './modules/api-keys/api-key.repository.js';
export function createApp() {
    const app = express();
    if (!hasDatabase()) {
        resetAuthStore();
        resetProjectsStore();
        resetFilesStore();
        resetConsentsStore();
        resetLogsStore();
        resetApiKeyStore();
        ensureDemoUser();
        ensureBootstrapAdmin();
    }
    app.disable('x-powered-by');
    app.use(helmet({
        crossOriginResourcePolicy: { policy: 'same-site' },
        contentSecurityPolicy: false
    }));
    app.use(cors({ origin: env.corsOrigin, credentials: true, methods: ['GET', 'POST', 'DELETE', 'PATCH', 'OPTIONS'] }));
    app.use(cookieParser());
    app.use(express.json({ limit: env.maxJsonBody }));
    app.use(requestLoggerMiddleware);
    app.use(requireSecureOrigin);
    app.use(rateLimit({
        windowMs: 60 * 1000,
        limit: env.maxRequestsPerMinute,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: { mensagem: 'Muitas requisições. Aguarde um momento.' }
    }));
    const authRateLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 15,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: { mensagem: 'Muitas tentativas de autenticação. Tente novamente mais tarde.' }
    });
    app.use(healthRouter);
    app.use('/api/auth', authRateLimiter, authRouter);
    app.use('/api/ai', aiRouter);
    app.use('/ai', aiRouter);
    app.use('/api/documents', documentsRouter);
    app.use('/documents', documentsRouter);
    app.use('/api/automations', automationsRouter);
    app.use('/api/projects', projectsRouter);
    app.use('/api/files', filesRouter);
    app.use('/api/api-keys', apiKeyRouter);
    app.use('/api/conversions', conversionsRouter);
    app.use('/api/integrations', integrationsRouter);
    app.use('/api/integrations/telegram', telegramRouter);
    app.use('/api/logs', logsRouter);
    app.use('/api/observability', observabilityRouter);
    app.use('/api/privacy', privacyRouter);
    app.use('/api/setup', setupRouter);
    app.use('/telegram', telegramStatusRouter);
    app.use('/telegram', telegramWebhookRouter);
    app.use(errorMiddleware);
    void addAuditLog({
        origem: 'api',
        mensagem: 'Aplicação Express configurada.'
    });
    return app;
}
