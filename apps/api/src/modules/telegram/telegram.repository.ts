import { randomUUID } from 'node:crypto';
import { getPrismaClient, hasDatabase } from '../../db/prisma.js';
import type {
  TelegramConnectResult,
  TelegramFileRecord,
  TelegramIntegrationRecord,
  TelegramPairingSessionRecord,
  TelegramTaskRecord
} from './telegram.types.js';

const integrations = new Map<string, TelegramIntegrationRecord>();
const pairings = new Map<string, TelegramPairingSessionRecord>();
const files = new Map<string, TelegramFileRecord>();
const tasks = new Map<string, TelegramTaskRecord>();

function nowIso() {
  return new Date().toISOString();
}

export async function saveTelegramIntegration(record: TelegramIntegrationRecord) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.telegramIntegration.upsert({
        where: { id: record.id },
        update: {
          botId: record.botId,
          botUsername: record.botUsername,
          botName: record.botName,
          encryptedBotToken: record.encryptedBotToken,
          webhookSecret: record.webhookSecret,
          status: record.status,
          chatId: record.chatId || null,
          telegramUserId: record.telegramUserId || null,
          allowedTelegramUserIds: record.allowedTelegramUserIds || undefined,
          connectedAt: record.connectedAt ? new Date(record.connectedAt) : null,
          lastUpdateAt: record.lastUpdateAt ? new Date(record.lastUpdateAt) : null,
          lastError: record.lastError || null
        },
        create: {
          ...record,
          chatId: record.chatId || null,
          telegramUserId: record.telegramUserId || null,
          allowedTelegramUserIds: record.allowedTelegramUserIds || [],
          connectedAt: record.connectedAt ? new Date(record.connectedAt) : null,
          lastUpdateAt: record.lastUpdateAt ? new Date(record.lastUpdateAt) : null,
          lastError: record.lastError || null
        }
      });
    }
    return record;
  }

  integrations.set(record.id, record);
  return record;
}

export async function getTelegramIntegrationById(id: string) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      const row = await prisma.telegramIntegration.findUnique({
        where: { id }
      });
      if (!row) return null;
      return rowToIntegration(row);
    }
  }

  return integrations.get(id) || null;
}

export async function getTelegramIntegrationByWebhookSecret(secret: string) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      const row = await prisma.telegramIntegration.findUnique({ where: { webhookSecret: secret } });
      return row ? rowToIntegration(row) : null;
    }
  }

  return [...integrations.values()].find((item) => item.webhookSecret === secret) || null;
}

export async function listTelegramIntegrationsByUser(userId: string) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      const rows = await prisma.telegramIntegration.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
      return rows.map(rowToIntegration);
    }
  }

  return [...integrations.values()].filter((item) => item.userId === userId);
}

export async function saveTelegramPairingSession(record: TelegramPairingSessionRecord) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.telegramPairingSession.upsert({
        where: { id: record.id },
        update: {
          status: record.status,
          expiresAt: new Date(record.expiresAt),
          completedAt: record.completedAt ? new Date(record.completedAt) : null
        },
        create: {
          ...record,
          expiresAt: new Date(record.expiresAt),
          completedAt: record.completedAt ? new Date(record.completedAt) : null
        }
      });
    }
    return record;
  }

  pairings.set(record.id, record);
  return record;
}

export async function getTelegramPairingByCode(pairingCode: string) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      const row = await prisma.telegramPairingSession.findUnique({ where: { pairingCode } });
      return row ? rowToPairing(row) : null;
    }
  }

  return [...pairings.values()].find((item) => item.pairingCode === pairingCode) || null;
}

export async function saveTelegramFile(record: TelegramFileRecord) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.telegramFile.create({
        data: {
          ...record
        }
      });
    }
    return record;
  }

  files.set(record.id, record);
  return record;
}

export async function listTelegramFilesByIntegration(integrationId: string) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      const rows = await prisma.telegramFile.findMany({
        where: { integrationId },
        orderBy: { createdAt: 'desc' }
      });
      return rows.map((row) => ({
        id: row.id,
        integrationId: row.integrationId,
        userId: row.userId,
        chatId: row.chatId,
        telegramFileId: row.telegramFileId,
        originalFilename: row.originalFilename,
        mimeType: row.mimeType,
        size: row.size,
        localPath: row.localPath,
        classification: row.classification as TelegramFileRecord['classification'],
        scanStatus: row.scanStatus as TelegramFileRecord['scanStatus'],
        createdAt: row.createdAt.toISOString()
      }));
    }
  }

  return [...files.values()].filter((item) => item.integrationId === integrationId);
}

export async function saveTelegramTask(record: TelegramTaskRecord) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.telegramTask.create({
        data: {
          ...record,
          fileIds: record.fileIds || []
        }
      });
    }
    return record;
  }

  tasks.set(record.id, record);
  return record;
}

export async function listTelegramTasksByIntegration(integrationId: string) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      const rows = await prisma.telegramTask.findMany({
        where: { integrationId },
        orderBy: { createdAt: 'desc' }
      });
      return rows.map((row) => ({
        id: row.id,
        integrationId: row.integrationId,
        userId: row.userId,
        chatId: row.chatId,
        command: row.command,
        prompt: row.prompt,
        fileIds: Array.isArray(row.fileIds) ? row.fileIds.map(String) : undefined,
        status: row.status as TelegramTaskRecord['status'],
        resultSummary: row.resultSummary || undefined,
        resultFilePath: row.resultFilePath || undefined,
        createdAt: row.createdAt.toISOString(),
        completedAt: row.completedAt ? row.completedAt.toISOString() : undefined
      }));
    }
  }

  return [...tasks.values()].filter((item) => item.integrationId === integrationId);
}

export async function deleteTelegramIntegration(id: string) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.telegramIntegration.delete({ where: { id } });
      return;
    }
  }

  integrations.delete(id);
}

export async function updateTelegramIntegration(record: TelegramIntegrationRecord) {
  record.updatedAt = nowIso();
  return saveTelegramIntegration(record);
}

function rowToIntegration(row: any): TelegramIntegrationRecord {
  return {
    id: row.id,
    userId: row.userId,
    tenantId: row.tenantId,
    botId: row.botId,
    botUsername: row.botUsername,
    botName: row.botName,
    encryptedBotToken: row.encryptedBotToken,
    webhookSecret: row.webhookSecret,
    status: row.status as TelegramIntegrationRecord['status'],
    chatId: row.chatId || undefined,
    telegramUserId: row.telegramUserId || undefined,
    allowedTelegramUserIds: Array.isArray(row.allowedTelegramUserIds) ? row.allowedTelegramUserIds.map(String) : undefined,
    createdAt: row.createdAt?.toISOString?.() || nowIso(),
    updatedAt: row.updatedAt?.toISOString?.() || nowIso(),
    connectedAt: row.connectedAt?.toISOString?.(),
    lastUpdateAt: row.lastUpdateAt?.toISOString?.(),
    lastError: row.lastError || undefined
  };
}

function rowToPairing(row: any): TelegramPairingSessionRecord {
  return {
    id: row.id,
    integrationId: row.integrationId,
    userId: row.userId,
    pairingCode: row.pairingCode,
    status: row.status as TelegramPairingSessionRecord['status'],
    expiresAt: row.expiresAt?.toISOString?.() || nowIso(),
    createdAt: row.createdAt?.toISOString?.() || nowIso(),
    completedAt: row.completedAt?.toISOString?.()
  };
}
