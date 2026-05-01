import { createApp } from './app.js';
import { env } from './config/env.js';
import { hasDatabase } from './db/prisma.js';
import { bootstrapPersistentAccounts } from './modules/auth/auth.service.js';
import { logger } from './modules/observability/logger.js';
async function start() {
    if (hasDatabase()) {
        await bootstrapPersistentAccounts();
    }
    const app = createApp();
    app.listen(env.port, () => {
        logger.info({ port: env.port }, 'API Mind_IA rodando');
    });
}
void start();
