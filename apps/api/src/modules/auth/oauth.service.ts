import { randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';
import { config } from '../../config/config.service.js';
import { getPrismaClient, hasDatabase } from '../../db/prisma.js';
import { addAuditLog, addSecurityLog } from '../logs/logs.service.js';
import type { AuthUser } from './auth.service.js';
import { getUserByEmail, issueSessionForUser, registerUser } from './auth.service.js';

export type OAuthProvider = 'google' | 'github' | 'azure';

interface OAuthProviderInfo {
  provider: OAuthProvider;
  label: string;
  enabled: boolean;
  source: 'env' | 'admin';
  updatedAt?: string;
  updatedBy?: string;
  clientId: string;
  authorizeEndpoint: string;
  scopes: string[];
}

interface OAuthProviderOverride {
  enabled: boolean;
  updatedAt: string;
  updatedBy?: string;
}

interface OAuthProviderOverridesFile {
  google?: OAuthProviderOverride;
  github?: OAuthProviderOverride;
  azure?: OAuthProviderOverride;
}

export interface OAuthRuntimeSummary {
  totalProviders: number;
  envEnabled: number;
  adminEnabled: number;
  overridden: number;
  disabled: number;
  lastUpdatedAt?: string;
  providers: Array<{
    provider: OAuthProvider;
    enabled: boolean;
    source: 'env' | 'admin';
    updatedAt?: string;
    updatedBy?: string;
  }>;
}

export interface OAuthDiagnosticsExport {
  generatedAt: string;
  summary: OAuthRuntimeSummary;
  providers: Awaited<ReturnType<typeof listOAuthProviders>>;
}

const overridesFilePath = path.resolve(process.cwd(), 'storage', 'oauth-provider-overrides.json');

const providers: Record<OAuthProvider, OAuthProviderInfo> = {
  google: {
    provider: 'google',
    label: 'Google Workspace',
    enabled: config.oauth.google.enabled,
    source: 'env',
    clientId: config.oauth.google.clientId,
    authorizeEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    scopes: ['openid', 'email', 'profile']
  },
  github: {
    provider: 'github',
    label: 'GitHub',
    enabled: config.oauth.github.enabled,
    source: 'env',
    clientId: config.oauth.github.clientId,
    authorizeEndpoint: 'https://github.com/login/oauth/authorize',
    scopes: ['read:user', 'user:email']
  },
  azure: {
    provider: 'azure',
    label: 'Microsoft Entra ID',
    enabled: config.oauth.azure.enabled,
    source: 'env',
    clientId: config.oauth.azure.clientId,
    authorizeEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    scopes: ['openid', 'email', 'profile']
  }
};

const providerOverrides = new Map<OAuthProvider, OAuthProviderOverride>(loadProviderOverrides());

async function getProviderOverride(provider: OAuthProvider) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      const row = await prisma.oAuthProviderOverride.findFirst({
        where: {
          provider,
          tenantId: 'global'
        }
      });
      if (row) {
        return {
          enabled: row.enabled,
          updatedAt: row.updatedAt.toISOString(),
          updatedBy: row.updatedBy || undefined
        };
      }
    }
  }

  return providerOverrides.get(provider);
}

async function persistProviderOverride(provider: OAuthProvider, override: OAuthProviderOverride) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.oAuthProviderOverride.upsert({
        where: {
          tenantId_provider: {
            tenantId: 'global',
            provider
          }
        },
        update: {
          enabled: override.enabled,
          updatedBy: override.updatedBy || null
        },
        create: {
          tenantId: 'global',
          provider,
          enabled: override.enabled,
          updatedBy: override.updatedBy || null
        }
      });
      return;
    }
  }

  providerOverrides.set(provider, override);
  persistProviderOverrides();
}

async function removeProviderOverride(provider: OAuthProvider) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.oAuthProviderOverride.deleteMany({
        where: {
          provider,
          tenantId: 'global'
        }
      });
      return;
    }
  }

  providerOverrides.delete(provider);
  persistProviderOverrides();
}

async function clearProviderOverrides() {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.oAuthProviderOverride.deleteMany({
        where: {
          tenantId: 'global'
        }
      });
      return;
    }
  }

  providerOverrides.clear();
  persistProviderOverrides();
}

function loadProviderOverrides() {
  try {
    const raw = readFileSync(overridesFilePath, 'utf8');
    const parsed = JSON.parse(raw) as OAuthProviderOverridesFile;
    return (Object.entries(parsed) as Array<[OAuthProvider, OAuthProviderOverride | undefined]>)
      .filter(([, value]) => Boolean(value))
      .map(([provider, value]) => [provider, value!]) as Array<[OAuthProvider, OAuthProviderOverride]>;
  } catch (_error) {
    return [];
  }
}

function persistProviderOverrides() {
  try {
    mkdirSync(path.dirname(overridesFilePath), { recursive: true });
    const serialized: OAuthProviderOverridesFile = {};
    for (const [provider, override] of providerOverrides.entries()) {
      serialized[provider] = override;
    }
    writeFileSync(overridesFilePath, `${JSON.stringify(serialized, null, 2)}\n`, 'utf8');
  } catch (error) {
    addSecurityLog('auth', 'Falha ao persistir overrides de OAuth.', {
      error: error instanceof Error ? error.message : 'erro_desconhecido'
    });
  }
}

async function currentProviderInfo(provider: OAuthProvider): Promise<OAuthProviderInfo> {
  const base = providers[provider];
  const override = await getProviderOverride(provider);

  if (!base) {
    throw new Error('Provedor OAuth inválido.');
  }

  return {
    ...base,
    enabled: override ? override.enabled : base.enabled,
    source: override ? 'admin' : 'env',
    updatedAt: override?.updatedAt,
    updatedBy: override?.updatedBy
  };
}

export function listOAuthProviders() {
  return Promise.all((Object.keys(providers) as OAuthProvider[]).map(async (provider) => {
    const info = await currentProviderInfo(provider);
    return {
      provider: info.provider,
      label: info.label,
      enabled: info.enabled,
      source: info.source,
      updatedAt: info.updatedAt,
      updatedBy: info.updatedBy,
      scopes: info.scopes
    };
  }));
}

export async function getOAuthRuntimeSummary(): Promise<OAuthRuntimeSummary> {
  const providerList = await listOAuthProviders();
  const envEnabled = providerList.filter((item) => item.source === 'env' && item.enabled).length;
  const adminEnabled = providerList.filter((item) => item.source === 'admin' && item.enabled).length;
  const overridden = providerList.filter((item) => item.source === 'admin').length;
  const disabled = providerList.filter((item) => !item.enabled).length;
  const lastUpdatedAt = providerList
    .map((item) => item.updatedAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .slice(-1)[0];

  return {
    totalProviders: providerList.length,
    envEnabled,
    adminEnabled,
    overridden,
    disabled,
    lastUpdatedAt,
    providers: providerList.map((item) => ({
      provider: item.provider,
      enabled: item.enabled,
      source: item.source,
      updatedAt: item.updatedAt,
      updatedBy: item.updatedBy
    }))
  };
}

export async function exportOAuthDiagnostics(): Promise<OAuthDiagnosticsExport> {
  return {
    generatedAt: new Date().toISOString(),
    summary: await getOAuthRuntimeSummary(),
    providers: await listOAuthProviders()
  };
}

export async function updateOAuthProvider(provider: OAuthProvider, enabled: boolean, updatedBy?: string) {
  const info = await currentProviderInfo(provider);
  const updatedAt = new Date().toISOString();
  await persistProviderOverride(provider, {
    enabled,
    updatedAt,
    updatedBy
  });

  addAuditLog({
    origem: 'auth',
    mensagem: 'Configuração OAuth atualizada por administrador.',
    detalhes: { provider, enabled, updatedBy }
  });

  return {
    provider: info.provider,
    label: info.label,
    enabled,
    source: 'admin' as const,
    updatedAt,
    updatedBy,
    scopes: info.scopes
  };
}

export async function resetOAuthProvider(provider: OAuthProvider, updatedBy?: string) {
  const info = await currentProviderInfo(provider);
  await removeProviderOverride(provider);

  addAuditLog({
    origem: 'auth',
    mensagem: 'Configuração OAuth restaurada para o padrão do ambiente.',
    detalhes: { provider, updatedBy }
  });

  return {
    provider: info.provider,
    label: info.label,
    enabled: providers[provider].enabled,
    source: 'env' as const,
    updatedBy,
    updatedAt: new Date().toISOString(),
    scopes: info.scopes
  };
}

export async function resetAllOAuthProviders(updatedBy?: string) {
  const before = await listOAuthProviders();
  await clearProviderOverrides();

  addAuditLog({
    origem: 'auth',
    mensagem: 'Todos os overrides OAuth foram restaurados para o padrão do ambiente.',
    detalhes: { updatedBy }
  });

  return {
    updatedBy,
    updatedAt: new Date().toISOString(),
    providers: before.map((provider) => ({
      provider: provider.provider,
      label: provider.label,
      enabled: providers[provider.provider].enabled,
      source: 'env' as const,
      updatedAt: undefined,
      updatedBy: undefined,
      scopes: provider.scopes
    }))
  };
}

export async function buildOAuthStartUrl(provider: OAuthProvider, redirectUri: string, state: string) {
  const info = await currentProviderInfo(provider);
  if (!info) {
    throw new Error('Provedor OAuth inválido.');
  }

  const url = new URL(info.authorizeEndpoint);
  url.searchParams.set('client_id', info.clientId || 'configure-client-id');
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', info.scopes.join(' '));
  url.searchParams.set('state', state);
  return url.toString();
}

export async function prepareOAuthLogin(provider: OAuthProvider, redirectUri: string) {
  const state = cryptoRandomState();
  const info = await currentProviderInfo(provider);
  const url = info?.enabled
    ? await buildOAuthStartUrl(provider, redirectUri, state)
    : `${redirectUri}${redirectUri.includes('?') ? '&' : '?'}provider=${provider}&state=${state}&mock=1`;

  addAuditLog({
    origem: 'auth',
    mensagem: 'Fluxo OAuth2 preparado.',
    detalhes: { provider, redirectUri, state }
  });

  return { provider, state, url };
}

export async function finishOAuthLogin(provider: OAuthProvider, profile: { email: string; name: string; sub?: string }) {
  let user = await getUserByEmail(profile.email);
  if (!user) {
    const session = await registerUser({
      nome: profile.name,
      email: profile.email,
      senha: randomBytes(24).toString('hex'),
      role: 'user',
      plano: 'PRO'
    });
    addSecurityLog('auth', 'Login OAuth2 concluído com conta criada.', { provider, email: session.usuario.email });
    return {
      ...session,
      usuario: session.usuario
    };
  }

  const usuario: AuthUser = {
    id: user.id,
    nome: profile.name || user.nome,
    email: user.email,
    plano: user.plano,
    role: user.role,
    tenantId: user.tenantId,
    tenantNome: user.tenantNome,
    deviceId: randomUUID().slice(0, 16)
  };

  const session = issueSessionForUser(usuario, 1, usuario.deviceId);
  addSecurityLog('auth', 'Login OAuth2 concluído em modo preparado.', { provider, email: usuario.email });
  return session;
}

function cryptoRandomState() {
  return randomBytes(16).toString('hex');
}
