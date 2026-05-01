import { getPrismaClient, hasDatabase } from '../../db/prisma.js';
import { deleteFilesByTenantId, listFiles } from '../files/files.service.js';
import { deleteProjectsByTenantId, listProjects } from '../projects/projects.service.js';
import { purgeLogsByUserId } from '../logs/logs.service.js';
import { deleteUserAccount, listUsers } from '../auth/auth.service.js';
import { deleteConsents, listConsents, recordConsent, requestConsent, type ConsentScope } from './consent.service.js';
import { listTelegramIntegrationsByUser } from '../telegram/telegram.repository.js';
import { removeTelegramIntegration } from '../telegram/telegram.service.js';

async function recordPrivacyRequest(userId: string, tenantId: string, type: 'export' | 'delete', status: 'completed' | 'pending' = 'completed', payload?: unknown) {
  if (!hasDatabase()) return;
  const prisma = getPrismaClient();
  if (!prisma) return;
  await prisma.privacyRequest.create({
    data: {
      userId,
      tenantId,
      type,
      status,
      payload: payload as never,
      completedAt: status === 'completed' ? new Date() : null
    }
  });
}

export async function registerUserConsent(userId: string, tenantId: string, scope: ConsentScope, accepted: boolean, version = '1.0') {
  return recordConsent(userId, tenantId, scope, accepted, version);
}

export function getConsentRequest(scope: ConsentScope) {
  return requestConsent(scope);
}

export async function exportUserData(userId: string) {
  const user = (await listUsers()).find((entry) => entry.id === userId);
  if (!user) {
    return {
      user: null,
      consents: [],
      files: [],
      projects: [],
      exportGeneratedAt: new Date().toISOString()
    };
  }

  const result = {
    user,
    consents: await listConsents(user.tenantId),
    files: await listFiles(user.tenantId),
    projects: await listProjects(user.tenantId),
    telegramIntegrations: await listTelegramIntegrationsByUser(userId),
    exportGeneratedAt: new Date().toISOString()
  };
  await recordPrivacyRequest(userId, user.tenantId, 'export', 'completed', { exportGeneratedAt: result.exportGeneratedAt });
  return result;
}

export async function deleteUserData(userId: string) {
  const user = (await listUsers()).find((entry) => entry.id === userId);
  if (!user) return false;
  const telegramIntegrations = await listTelegramIntegrationsByUser(userId);
  for (const integration of telegramIntegrations) {
    await removeTelegramIntegration(integration.id, userId).catch(() => undefined);
  }
  await deleteProjectsByTenantId(user.tenantId);
  await deleteFilesByTenantId(user.tenantId);
  await deleteConsents(user.tenantId);
  await purgeLogsByUserId(userId);
  await recordPrivacyRequest(userId, user.tenantId, 'delete', 'completed');
  return deleteUserAccount(userId);
}
