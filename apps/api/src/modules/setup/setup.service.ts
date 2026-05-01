import { randomUUID } from 'node:crypto';
import { getPrismaClient, hasDatabase } from '../../db/prisma.js';
import { config } from '../../config/config.service.js';
import { registerUser, listUsers } from '../auth/auth.service.js';
import { getAwsHealth } from '../aws/aws-health.service.js';
import { saveFile, deleteFile } from '../storage/storage.service.js';

function hasAdminUser(users: Array<{ role: string }>) {
  return users.some((user) => user.role === 'admin');
}

export async function getSetupStatus() {
  const users = await listUsers();
  const database = {
    configured: hasDatabase(),
    connected: hasDatabase()
  };

  const adminExists = hasAdminUser(users);
  const aws = await getAwsHealth();

  return {
    configured: adminExists,
    locked: adminExists,
    database,
    storage: config.storage.driver === 's3'
      ? { configured: true, driver: 's3' as const, status: aws.status }
      : { configured: true, driver: 'local' as const, status: 'connected' },
    aws,
    email: {
      configured: Boolean(config.email.smtpHost && config.email.smtpFrom),
      status: config.email.smtpHost ? 'configured' : 'not_configured'
    },
    telegram: {
      configured: Boolean(config.appPublicUrl),
      status: config.appPublicUrl ? 'configured' : 'not_configured'
    }
  };
}

export async function createSetupAdmin(input: { nome: string; email: string; senha: string; setupToken?: string }) {
  if (config.setupToken && input.setupToken !== config.setupToken) {
    throw new Error('SETUP_TOKEN inválido.');
  }

  const users = await listUsers();
  if (hasAdminUser(users)) {
    throw new Error('O setup inicial já foi concluído.');
  }

  return registerUser({
    nome: input.nome,
    email: input.email,
    senha: input.senha,
    role: 'admin',
    plano: 'EMPRESA'
  });
}

export async function validateDatabaseConnection() {
  if (!hasDatabase()) {
    return { ok: false, service: 'database', status: 'not_configured', message: 'DATABASE_URL não configurado.' };
  }

  const prisma = getPrismaClient();
  if (!prisma) {
    return { ok: false, service: 'database', status: 'error', message: 'Cliente Prisma indisponível.' };
  }

  await prisma.$queryRaw`SELECT 1`;
  return { ok: true, service: 'database', status: 'connected', message: 'Conexão validada com sucesso' };
}

export async function validateStorageConnection() {
  const payload = Buffer.from(`setup-${randomUUID()}`, 'utf8');
  const saved = await saveFile({
    tenantId: 'setup',
    userId: 'setup',
    filename: 'setup-check.txt',
    buffer: payload,
    mimeType: 'text/plain'
  });

  await deleteFile(saved.path).catch(() => undefined);
  return { ok: true, service: 'storage', status: 'connected', message: 'Conexão validada com sucesso' };
}

export async function validateAwsConnection() {
  const aws = await getAwsHealth();
  if (!aws.configured) {
    return { ok: false, service: 'aws', status: 'not_configured', message: 'AWS não configurado.' };
  }

  return { ok: aws.status === 'connected', service: 'aws', status: aws.status, message: aws.status === 'connected' ? 'Conexão validada com sucesso' : 'Credencial inválida ou bucket inacessível', safeDetails: aws.status };
}

export async function validateEmailConnection() {
  if (!config.email.smtpHost || !config.email.smtpFrom) {
    return { ok: false, service: 'smtp', status: 'not_configured', message: 'SMTP não configurado.' };
  }

  return { ok: true, service: 'smtp', status: 'connected', message: 'Conexão validada com sucesso' };
}
