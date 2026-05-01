import QRCode from 'qrcode';
import { randomUUID } from 'node:crypto';
import { config } from '../../config/config.service.js';
import { addAuditLog, addSecurityLog } from '../logs/logs.service.js';
import { executeAiFlow } from '../ai/ai.service.js';
import { exportUserData, registerUserConsent } from '../privacy/privacy.service.js';
import { hasConsent } from '../privacy/consent.service.js';
import { scanFileForThreats } from '../security/file-security.service.js';
import { encryptSecret, decryptSecret } from '../security/secret-vault.service.js';
import { saveFile } from '../storage/storage.service.js';
import { getTelegramBotInfo, deleteTelegramWebhook, getTelegramDeepLink, getTelegramFile, getTelegramWebhookUrl, sendTelegramMessage, setTelegramWebhook } from './telegram.client.js';
import { checkTelegramRateLimit, getTelegramMaxFileBytes, isAllowedTelegramFile, sanitizeTelegramFilename, generatePairingCode, generateWebhookSecret } from './telegram.security.js';
import {
  deleteTelegramIntegration,
  getTelegramIntegrationById,
  getTelegramIntegrationByWebhookSecret,
  getTelegramPairingByCode,
  listTelegramIntegrationsByUser,
  saveTelegramFile,
  saveTelegramIntegration,
  saveTelegramPairingSession,
  saveTelegramTask,
  updateTelegramIntegration
} from './telegram.repository.js';
import type {
  TelegramConnectResult,
  TelegramFileRecord,
  TelegramIntegrationRecord,
  TelegramPairingSessionRecord,
  TelegramWebhookReply
} from './telegram.types.js';

function classifyFile(filename: string, mimeType: string) {
  const extension = filename.includes('.') ? filename.split('.').pop()?.toLowerCase() : '';
  if (extension === 'zip') return 'critico' as const;
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension || '')) return 'sensivel' as const;
  if (mimeType.startsWith('image/')) return 'interno' as const;
  return 'publico' as const;
}

function buildReply(text: string): TelegramWebhookReply {
  return { handled: true, replyText: text };
}

async function persistPairingSession(integration: TelegramIntegrationRecord, userId: string, pairingCode: string, expiresAt: string) {
  const pairing: TelegramPairingSessionRecord = {
    id: randomUUID(),
    integrationId: integration.id,
    userId,
    pairingCode,
    status: 'pending',
    expiresAt,
    createdAt: new Date().toISOString()
  };
  await saveTelegramPairingSession(pairing);
  return pairing;
}

export async function connectTelegramBot(userId: string, tenantId: string, botToken: string): Promise<TelegramConnectResult> {
  const botInfo = await getTelegramBotInfo(botToken);
  if (!botInfo.ok || !botInfo.result?.username) {
    throw new Error('Token Telegram inválido.');
  }

  const webhookSecret = generateWebhookSecret();
  const pairingCode = generatePairingCode();
  const expiresAt = new Date(Date.now() + config.telegram.pairingTtlMinutes * 60 * 1000).toISOString();
  const integration: TelegramIntegrationRecord = {
    id: randomUUID(),
    userId,
    tenantId,
    botId: String(botInfo.result.id),
    botUsername: botInfo.result.username,
    botName: botInfo.result.first_name,
    encryptedBotToken: encryptSecret(botToken),
    webhookSecret,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await saveTelegramIntegration(integration);
  await persistPairingSession(integration, userId, pairingCode, expiresAt);

  const deepLink = getTelegramDeepLink(integration.botUsername, pairingCode);
  const qrCodeDataUrl = await QRCode.toDataURL(deepLink);

  let warning: string | undefined;
  const webhookUrl = getTelegramWebhookUrl(webhookSecret);
  if (webhookUrl) {
    await setTelegramWebhook(botToken, webhookUrl);
    integration.status = 'active';
    integration.connectedAt = new Date().toISOString();
    await updateTelegramIntegration(integration);
  } else {
    warning = 'APP_PUBLIC_URL não configurado. Integração permanece em modo manual/dev.';
    await addSecurityLog('telegram', warning, { userId, tenantId, botUsername: integration.botUsername });
  }

  await addAuditLog({
    origem: 'telegram',
    mensagem: 'Integração Telegram criada.',
    detalhes: { userId, tenantId, botUsername: integration.botUsername, status: integration.status }
  });

  return {
    integrationId: integration.id,
    botUsername: integration.botUsername,
    botName: integration.botName,
    pairingCode,
    deepLink,
    qrCodeDataUrl,
    expiresAt,
    status: integration.status,
    warning
  };
}

export async function getTelegramStatus(userId: string) {
  return listTelegramIntegrationsByUser(userId);
}

export async function refreshTelegramPairing(integrationId: string, userId: string) {
  const integration = await getTelegramIntegrationById(integrationId);
  if (!integration || integration.userId !== userId) {
    throw new Error('Integração não encontrada.');
  }

  const pairingCode = generatePairingCode();
  const expiresAt = new Date(Date.now() + config.telegram.pairingTtlMinutes * 60 * 1000).toISOString();
  await persistPairingSession(integration, userId, pairingCode, expiresAt);
  const deepLink = getTelegramDeepLink(integration.botUsername, pairingCode);
  const qrCodeDataUrl = await QRCode.toDataURL(deepLink);

  await addAuditLog({
    origem: 'telegram',
    mensagem: 'Pairing Telegram renovado.',
    detalhes: { integrationId, userId, botUsername: integration.botUsername }
  });

  return { pairingCode, deepLink, qrCodeDataUrl, expiresAt };
}

export async function disableTelegramIntegration(integrationId: string, userId: string) {
  const integration = await getTelegramIntegrationById(integrationId);
  if (!integration || integration.userId !== userId) throw new Error('Integração não encontrada.');
  const token = decryptSecret(integration.encryptedBotToken);
  await deleteTelegramWebhook(token).catch(() => undefined);
  integration.status = 'disabled';
  await updateTelegramIntegration(integration);
  await addAuditLog({ origem: 'telegram', mensagem: 'Integração Telegram desativada.', detalhes: { integrationId, userId } });
  return integration;
}

export async function removeTelegramIntegration(integrationId: string, userId: string) {
  const integration = await getTelegramIntegrationById(integrationId);
  if (!integration || integration.userId !== userId) throw new Error('Integração não encontrada.');
  const token = decryptSecret(integration.encryptedBotToken);
  await deleteTelegramWebhook(token).catch(() => undefined);
  await deleteTelegramIntegration(integrationId);
  await addAuditLog({ origem: 'telegram', mensagem: 'Integração Telegram removida.', detalhes: { integrationId, userId } });
}

export async function testTelegramIntegration(integrationId: string, userId: string) {
  const integration = await getTelegramIntegrationById(integrationId);
  if (!integration || integration.userId !== userId || !integration.chatId) {
    throw new Error('Integração sem chat vinculado.');
  }
  const token = decryptSecret(integration.encryptedBotToken);
  await sendTelegramMessage(token, integration.chatId, 'Teste de conexão Mind_IA concluído.');
  return { ok: true };
}

export async function handleTelegramWebhook(secret: string, update: any): Promise<TelegramWebhookReply> {
  const integration = await getTelegramIntegrationByWebhookSecret(secret);
  if (!integration) {
    return { handled: false };
  }

  const chatId = String(update?.message?.chat?.id || update?.callback_query?.message?.chat?.id || '');
  const telegramUserId = String(update?.message?.from?.id || update?.callback_query?.from?.id || '');
  if (!chatId) {
    return { handled: false };
  }

  if (!checkTelegramRateLimit(`${chatId}:messages`, config.telegram.maxMessagesPerMinute, 60 * 1000)) {
    await addSecurityLog('telegram', 'Rate limit de mensagens excedido.', { chatId, integrationId: integration.id });
    return buildReply('Muitas mensagens. Aguarde um pouco e tente novamente.');
  }

  integration.chatId = chatId;
  integration.telegramUserId = telegramUserId || integration.telegramUserId;
  integration.lastUpdateAt = new Date().toISOString();

  const text = String(update?.message?.text || '').trim();
  if (text.startsWith('/start')) {
    const pairingCode = text.split(/\s+/)[1] || '';
    const pairing = pairingCode ? await getTelegramPairingByCode(pairingCode) : null;
    if (!pairing || pairing.integrationId !== integration.id) {
      return buildReply('Código de pareamento inválido ou expirado.');
    }

    if (new Date(pairing.expiresAt).getTime() < Date.now()) {
      pairing.status = 'expired';
      return buildReply('Código expirado. Gere um novo pareamento no painel.');
    }

    pairing.status = 'completed';
    pairing.completedAt = new Date().toISOString();
    integration.status = 'active';
    integration.connectedAt = new Date().toISOString();
    await updateTelegramIntegration(integration);
    await saveTelegramPairingSession(pairing);
    await addAuditLog({ origem: 'telegram', mensagem: 'Pareamento Telegram concluído.', detalhes: { integrationId: integration.id, userId: integration.userId } });
    return buildReply('Telegram conectado ao Mind_IA com sucesso.');
  }

  if (text === '/help') {
    await updateTelegramIntegration(integration);
    return buildReply('/start, /help, /status, /task, /deepclaw, /resumo, /privacy, /consent aceitar');
  }

  if (text === '/status') {
    await updateTelegramIntegration(integration);
    return buildReply(`Status da integração: ${integration.status}.`);
  }

  if (text === '/privacy') {
    const data = await exportUserData(integration.userId);
    await updateTelegramIntegration(integration);
    return buildReply(`Privacidade ativa para ${data.user?.email || 'usuário'}.\nUse /consent aceitar para permitir processamento.`);
  }

  if (text === '/consent aceitar') {
    await registerUserConsent(integration.userId, integration.tenantId, 'processing', true, '1.0');
    await updateTelegramIntegration(integration);
    return buildReply('Consentimento registrado.');
  }

  if (text.startsWith('/task') || text.startsWith('/deepclaw') || text.startsWith('/analisar') || text.startsWith('/resumo')) {
    const consentOk = await hasConsent(integration.userId, integration.tenantId, 'processing');
    if (!consentOk) {
      return buildReply('Antes de processar documentos, envie /consent aceitar.');
    }

    const prompt = text.replace(/^\/\w+\s*/, '') || 'Analise o conteúdo recebido e responda em português.';
    const task = await saveTelegramTask({
      id: randomUUID(),
      integrationId: integration.id,
      userId: integration.userId,
      chatId,
      command: text.split(/\s+/)[0].replace(/^\//, ''),
      prompt,
      fileIds: undefined,
      status: 'running',
      createdAt: new Date().toISOString()
    });
    const ai = await executeAiFlow({ mensagem: prompt, userId: integration.userId });
    task.status = 'completed';
    task.resultSummary = ai.respostaFinal.slice(0, 240);
    task.completedAt = new Date().toISOString();
    await saveTelegramTask(task);
    await updateTelegramIntegration(integration);
    return buildReply(ai.respostaFinal.slice(0, 3800));
  }

  const attachment = update?.message?.document || update?.message?.audio || update?.message?.voice || update?.message?.video || (Array.isArray(update?.message?.photo) ? update.message.photo.at(-1) : null);
  if (attachment?.file_id) {
    const fileName = sanitizeTelegramFilename(attachment.file_name || attachment.file_unique_id || 'telegram-file');
    const mimeType = attachment.mime_type || 'application/octet-stream';
    const fileSize = Number(attachment.file_size || 0);

    if (fileSize > getTelegramMaxFileBytes()) {
      return buildReply('Arquivo excede o limite permitido.');
    }

    if (!isAllowedTelegramFile(fileName, mimeType)) {
      return buildReply('Arquivo não permitido.');
    }

    const token = decryptSecret(integration.encryptedBotToken);
    const fileInfo = await getTelegramFile(token, attachment.file_id);
    const filePath = fileInfo.result.file_path;
    if (!filePath) {
      return buildReply('Não foi possível obter o arquivo.');
    }

    const downloadUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      return buildReply('Falha ao baixar o arquivo do Telegram.');
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const stored = await saveFile({
      tenantId: integration.tenantId,
      userId: integration.userId,
      filename: fileName,
      buffer,
      mimeType
    });

    const scanStatus = scanFileForThreats(buffer) ? 'blocked' : 'ok';
    const record: TelegramFileRecord = {
      id: randomUUID(),
      integrationId: integration.id,
      userId: integration.userId,
      chatId,
      telegramFileId: attachment.file_id,
      originalFilename: fileName,
      mimeType,
      size: buffer.length,
      localPath: stored.path,
      classification: classifyFile(fileName, mimeType),
      scanStatus,
      createdAt: new Date().toISOString()
    };
    await saveTelegramFile(record);
    await addAuditLog({
      origem: 'telegram',
      mensagem: 'Arquivo Telegram recebido.',
      detalhes: { integrationId: integration.id, userId: integration.userId, filename: fileName, classification: record.classification }
    });

    if (record.scanStatus === 'blocked') {
      await updateTelegramIntegration(integration);
      return buildReply('Arquivo bloqueado pelo scan de segurança.');
    }

    await updateTelegramIntegration(integration);
    return buildReply('Arquivo recebido. Use /analisar para ativar DeepClaw.');
  }

  await updateTelegramIntegration(integration);
  return { handled: true };
}

export async function replyTelegramWebhook(secret: string, update: any) {
  const result = await handleTelegramWebhook(secret, update);
  if (!result.handled) return result;

  const integration = await getTelegramIntegrationByWebhookSecret(secret);
  if (!integration) return result;

  const chatId = String(update?.message?.chat?.id || update?.callback_query?.message?.chat?.id || '');
  const replyText = result.replyText;
  if (replyText && chatId) {
    const token = decryptSecret(integration.encryptedBotToken);
    await sendTelegramMessage(token, chatId, replyText).catch((error) => {
      void addSecurityLog('telegram', 'Falha ao enviar resposta para Telegram.', {
        error: error instanceof Error ? error.message : 'erro_desconhecido',
        chatId,
        integrationId: integration.id
      });
    });
  }

  return result;
}
