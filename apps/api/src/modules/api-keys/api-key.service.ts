import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { addAuditLog, addSecurityLog } from '../logs/logs.service.js';
import type { AuthUser } from '../auth/auth.service.js';
import type { ApiKeyPublicInfo, ApiKeyRecord, CreateApiKeyInput } from './api-key.types.js';
import { createApiKeyRecord, getApiKeyById, getApiKeyByPrefix, hashApiKeyValue, listApiKeysByTenant, markApiKeyUsed, revokeApiKey } from './api-key.repository.js';

function publicApiKey(record: ApiKeyRecord): ApiKeyPublicInfo {
  return {
    id: record.id,
    name: record.name,
    keyPrefix: record.keyPrefix,
    scopes: record.scopes,
    status: record.status,
    expiresAt: record.expiresAt,
    lastUsedAt: record.lastUsedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function generateApiKeyValue(scope = 'live') {
  return `opx_${scope}_${randomBytes(6).toString('hex')}_${randomUUID().replace(/-/g, '')}`;
}

export async function createApiKey(user: AuthUser, input: CreateApiKeyInput, scope: 'live' | 'test' = 'live') {
  const plainKey = generateApiKeyValue(scope);
  const keyPrefix = plainKey.split('_')[2] || randomBytes(4).toString('hex');
  const record = await createApiKeyRecord({
    keyPrefix,
    keyHash: hashApiKeyValue(plainKey),
    name: input.name,
    scopes: input.scopes || [],
    tenantId: user.tenantId,
    userId: user.id,
    status: 'active',
    expiresAt: input.expiresAt
  });

  await addAuditLog({
    origem: 'api-keys',
    mensagem: 'API key criada.',
    tenantId: user.tenantId,
    userId: user.id,
    detalhes: { keyId: record.id, keyPrefix: record.keyPrefix, scopes: record.scopes }
  });

  return { record: publicApiKey(record), apiKey: plainKey };
}

export async function listApiKeys(user: AuthUser) {
  const keys = await listApiKeysByTenant(user.tenantId);
  return keys.map(publicApiKey);
}

export async function removeApiKey(user: AuthUser, id: string) {
  const record = await getApiKeyById(id);
  if (!record || record.tenantId !== user.tenantId) {
    throw new Error('Chave não encontrada.');
  }

  const revoked = await revokeApiKey(id);
  await addSecurityLog('api-keys', 'API key revogada.', { keyId: id, tenantId: user.tenantId, userId: user.id });
  return revoked ? publicApiKey(revoked) : null;
}

export async function rotateApiKey(user: AuthUser, id: string) {
  const record = await getApiKeyById(id);
  if (!record || record.tenantId !== user.tenantId) {
    throw new Error('Chave não encontrada.');
  }

  const next = await revokeApiKey(id);
  if (!next) {
    throw new Error('Não foi possível rotacionar a chave.');
  }

  return createApiKey(user, { name: record.name, scopes: record.scopes, expiresAt: record.expiresAt }, 'live');
}

export async function validateApiKeyValue(apiKey: string) {
  const parts = apiKey.split('_');
  if (parts.length < 4 || parts[0] !== 'opx') return null;
  const keyPrefix = parts[2];
  const record = await getApiKeyByPrefix(keyPrefix);
  if (!record || record.status !== 'active') return null;
  if (record.expiresAt && new Date(record.expiresAt).getTime() < Date.now()) return null;

  const expectedHash = hashApiKeyValue(apiKey);
  const actualHash = record.keyHash;
  const ok = actualHash.length === expectedHash.length && timingSafeEqual(Buffer.from(actualHash), Buffer.from(expectedHash));
  if (!ok) return null;

  await markApiKeyUsed(record.id);
  return publicApiKey(record);
}

export { publicApiKey };
