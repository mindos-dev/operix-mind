import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import {
  connectTelegramBot,
  disableTelegramIntegration,
  refreshTelegramPairing,
  removeTelegramIntegration,
  replyTelegramWebhook,
  getTelegramStatus,
  testTelegramIntegration
} from './telegram.service.js';
import { getTelegramIntegrationByWebhookSecret } from './telegram.repository.js';

export const telegramRouter = Router();
export const telegramWebhookRouter = Router();
export const telegramStatusRouter = Router();

const connectSchema = z.object({
  botToken: z.string().min(10).max(500)
});

telegramRouter.use(authMiddleware);

telegramRouter.post('/connect', requirePermission('integrations:connect'), validateBody(connectSchema), async (req, res) => {
  try {
    const dados = await connectTelegramBot(req.user!.id, req.user!.tenantId, req.body.botToken);
    res.status(201).json({ dados });
  } catch (error) {
    res.status(400).json({ mensagem: error instanceof Error ? error.message : 'Erro ao conectar Telegram.' });
  }
});

telegramRouter.get('/status', async (req, res) => {
  const dados = await getTelegramStatus(req.user!.id);
  res.json({ dados });
});

telegramRouter.post('/:id/test', requirePermission('integrations:connect'), async (req, res) => {
  try {
    const dados = await testTelegramIntegration(String(req.params.id || ''), req.user!.id);
    res.json({ dados });
  } catch (error) {
    res.status(400).json({ mensagem: error instanceof Error ? error.message : 'Erro ao testar integração.' });
  }
});

telegramRouter.post('/:id/disable', requirePermission('integrations:connect'), async (req, res) => {
  try {
    const dados = await disableTelegramIntegration(String(req.params.id || ''), req.user!.id);
    res.json({ dados });
  } catch (error) {
    res.status(400).json({ mensagem: error instanceof Error ? error.message : 'Erro ao desativar integração.' });
  }
});

telegramRouter.delete('/:id', requirePermission('integrations:connect'), async (req, res) => {
  try {
    await removeTelegramIntegration(String(req.params.id || ''), req.user!.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ mensagem: error instanceof Error ? error.message : 'Erro ao remover integração.' });
  }
});

telegramRouter.post('/:id/refresh-pairing', requirePermission('integrations:connect'), async (req, res) => {
  try {
    const dados = await refreshTelegramPairing(String(req.params.id || ''), req.user!.id);
    res.json({ dados });
  } catch (error) {
    res.status(400).json({ mensagem: error instanceof Error ? error.message : 'Erro ao renovar pareamento.' });
  }
});

telegramWebhookRouter.post('/webhook/:secret', async (req, res) => {
  const secret = String(req.params.secret || '');
  const integration = await getTelegramIntegrationByWebhookSecret(secret);
  if (!integration) {
    res.status(404).json({ mensagem: 'Webhook desconhecido.' });
    return;
  }

  await replyTelegramWebhook(secret, req.body).catch(() => undefined);
  res.json({ dados: { ok: true } });
});

telegramStatusRouter.get('/status', (_req, res) => {
  res.json({ dados: { ativo: true, modulo: 'telegram' } });
});
