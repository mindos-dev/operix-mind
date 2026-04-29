import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { requireSecureOrigin } from './modules/security/security.guard.js';
import { aiRouter } from './modules/ai/ai.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { automationsRouter } from './modules/automations/automations.routes.js';
import { ensureDemoUser } from './modules/auth/auth.service.js';
import { conversionsRouter } from './modules/conversions/conversions.routes.js';
import { filesRouter } from './modules/files/files.routes.js';
import { integrationsRouter } from './modules/integrations/integrations.routes.js';
import { logsRouter } from './modules/logs/logs.routes.js';
import { addAuditLog } from './modules/logs/logs.service.js';
import { privacyRouter } from './modules/privacy/privacy.routes.js';
import { projectsRouter } from './modules/projects/projects.routes.js';
export function createApp() {
    const app = express();
    ensureDemoUser();
    app.disable('x-powered-by');
    app.use(helmet({
        crossOriginResourcePolicy: { policy: 'same-site' },
        contentSecurityPolicy: false
    }));
    app.use(cors({ origin: env.corsOrigin, credentials: false, methods: ['GET', 'POST', 'DELETE', 'PATCH', 'OPTIONS'] }));
    app.use(express.json({ limit: env.maxJsonBody }));
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
    app.get('/health', (_req, res) => {
        res.json({
            app: 'Mind_IA API',
            status: 'ok',
            ambiente: env.nodeEnv,
            criadoEm: new Date().toISOString()
        });
    });
    app.use('/api/auth', authRateLimiter, authRouter);
    app.use('/api/ai', aiRouter);
    app.use('/api/automations', automationsRouter);
    app.use('/api/projects', projectsRouter);
    app.use('/api/files', filesRouter);
    app.use('/api/conversions', conversionsRouter);
    app.use('/api/integrations', integrationsRouter);
    app.use('/api/logs', logsRouter);
    app.use('/api/privacy', privacyRouter);
    app.use(errorMiddleware);
    addAuditLog({
        origem: 'api',
        mensagem: 'Aplicação Express configurada.'
    });
    return app;
}
