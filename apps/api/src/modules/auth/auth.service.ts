import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { config } from '../../config/config.service.js';
import { getPrismaClient, hasDatabase } from '../../db/prisma.js';
import { addAuditLog, addSecurityLog } from '../logs/logs.service.js';
import { hashPassword, verifyPassword } from './password.service.js';
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from './jwt.service.js';

export type AuthUserRole = 'admin' | 'user' | 'dev' | 'enterprise';
export type AuthUserPlan = 'GRATIS' | 'PRO' | 'ENGENHARIA' | 'DEV' | 'EMPRESA';

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  plano: AuthUserPlan;
  role: AuthUserRole;
  tenantId: string;
  tenantNome?: string;
  deviceId?: string;
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  name: string;
  role: AuthUserRole;
  plano: AuthUserPlan;
  tenantId: string;
  tenantNome?: string;
  deviceId: string;
  type: 'access' | 'refresh';
  version?: number;
}

interface StoredUser extends AuthUser {
  senhaHash: string;
  consentedAt?: string;
  refreshTokenVersion: number;
}

interface StoredRefreshSession {
  userId: string;
  tenantId: string;
  deviceId: string;
  refreshTokenHash: string;
  version: number;
  revokedAt?: string;
  expiresAt: string;
}

const usersByEmail = new Map<string, StoredUser>();
const usersById = new Map<string, StoredUser>();
const refreshSessions = new Map<string, StoredRefreshSession>();

export function resetAuthStore() {
  usersByEmail.clear();
  usersById.clear();
  refreshSessions.clear();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeTenantSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'tenant';
}

function publicUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    plano: user.plano,
    role: user.role,
    tenantId: user.tenantId,
    tenantNome: user.tenantNome
  };
}

function roleForPlan(plan: AuthUserPlan): AuthUserRole {
  if (plan === 'DEV') return 'dev';
  if (plan === 'EMPRESA') return 'enterprise';
  if (plan === 'ENGENHARIA') return 'enterprise';
  if (plan === 'PRO') return 'user';
  return 'user';
}

function planForRole(role: AuthUserRole): AuthUserPlan {
  if (role === 'dev') return 'DEV';
  if (role === 'enterprise') return 'EMPRESA';
  if (role === 'admin') return 'EMPRESA';
  return 'GRATIS';
}

function sessionKey(userId: string, deviceId: string) {
  return `${userId}:${deviceId}`;
}

function issueSession(user: StoredUser, deviceId: string = randomUUID()) {
  const usuario = publicUser({ ...user, deviceId });
  const accessToken = signAccessToken(usuario);
  const refreshToken = signRefreshToken(usuario, user.refreshTokenVersion, deviceId);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  if (hasDatabase()) {
    void persistRefreshSession({
      userId: user.id,
      tenantId: user.tenantId,
      deviceId,
      refreshTokenHash: bcrypt.hashSync(refreshToken, bcrypt.genSaltSync(8)),
      version: user.refreshTokenVersion,
      expiresAt
    });
  } else {
    refreshSessions.set(sessionKey(user.id, deviceId), {
      userId: user.id,
      tenantId: user.tenantId,
      deviceId,
      refreshTokenHash: bcrypt.hashSync(refreshToken, bcrypt.genSaltSync(8)),
      version: user.refreshTokenVersion,
      expiresAt
    });
  }

  addSecurityLog('auth', 'Sessão emitida.', {
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
    plano: user.plano,
    deviceId
  });

  return {
    usuario,
    accessToken,
    refreshToken,
    token: accessToken,
    expiresIn: config.jwt.accessTtl
  };
}

export function issueSessionForUser(user: AuthUser, refreshTokenVersion = 1, deviceId: string = randomUUID()) {
  const storedUser: StoredUser = {
    ...user,
    senhaHash: '',
    refreshTokenVersion
  };
  return issueSession(storedUser, deviceId);
}

function getMemoryUserByEmail(email: string) {
  return usersByEmail.get(normalizeEmail(email));
}

function getMemoryUserById(id: string) {
  return usersById.get(id);
}

async function getPersistentUserByEmail(email: string) {
  const prisma = getPrismaClient();
  if (!prisma) return null;
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
    include: { tenant: true }
  });
  if (!user) return null;
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    plano: user.plano as AuthUserPlan,
    role: user.role as AuthUserRole,
    tenantId: user.tenantId,
    tenantNome: user.tenant.nome,
    senhaHash: user.senhaHash,
    refreshTokenVersion: 1
  } satisfies StoredUser;
}

async function getPersistentUserById(id: string) {
  const prisma = getPrismaClient();
  if (!prisma) return null;
  const user = await prisma.user.findUnique({
    where: { id },
    include: { tenant: true }
  });
  if (!user) return null;
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    plano: user.plano as AuthUserPlan,
    role: user.role as AuthUserRole,
    tenantId: user.tenantId,
    tenantNome: user.tenant.nome,
    senhaHash: user.senhaHash,
    refreshTokenVersion: 1
  } satisfies StoredUser;
}

async function ensureTenant(prismaTenantName: string, existingTenantId?: string) {
  const prisma = getPrismaClient();
  if (!prisma) {
    return {
      id: existingTenantId || randomUUID(),
      nome: prismaTenantName,
      slug: normalizeTenantSlug(prismaTenantName)
    };
  }

  const slug = normalizeTenantSlug(prismaTenantName);
  const tenant = await prisma.organization.upsert({
    where: {
      slug
    },
    update: {
      nome: prismaTenantName
    },
    create: {
      nome: prismaTenantName,
      slug
    }
  });

  return tenant;
}

async function persistUserAndTenant(input: { nome: string; email: string; senhaHash: string; role: AuthUserRole; plano: AuthUserPlan; tenantNome: string }) {
  const prisma = getPrismaClient();
  if (!prisma) {
    const tenant = await ensureTenant(input.tenantNome);
    const user: StoredUser = {
      id: randomUUID(),
      nome: input.nome,
      email: input.email,
      plano: input.plano,
      role: input.role,
      tenantId: tenant.id,
      tenantNome: tenant.nome,
      senhaHash: input.senhaHash,
      refreshTokenVersion: 1,
      consentedAt: new Date().toISOString()
    };

    usersByEmail.set(user.email, user);
    usersById.set(user.id, user);
    return user;
  }

  const tenant = await ensureTenant(input.tenantNome);
  const user = await prisma.user.create({
    data: {
      nome: input.nome,
      email: input.email,
      senhaHash: input.senhaHash,
      plano: input.plano,
      role: input.role,
      tenantId: tenant.id
    },
    include: { tenant: true }
  });

  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    plano: user.plano as AuthUserPlan,
    role: user.role as AuthUserRole,
    tenantId: user.tenantId,
    tenantNome: user.tenant.nome,
    senhaHash: user.senhaHash,
    refreshTokenVersion: 1
  } satisfies StoredUser;
}

async function persistRefreshSession(session: StoredRefreshSession) {
  const prisma = getPrismaClient();
  if (!prisma) {
    refreshSessions.set(sessionKey(session.userId, session.deviceId), session);
    return session;
  }

  await prisma.refreshSession.upsert({
    where: {
      userId_deviceId: {
        userId: session.userId,
        deviceId: session.deviceId
      }
    },
    update: {
      tenantId: session.tenantId,
      refreshTokenHash: session.refreshTokenHash,
      version: session.version,
      revokedAt: session.revokedAt ? new Date(session.revokedAt) : null,
      expiresAt: new Date(session.expiresAt)
    },
    create: {
      userId: session.userId,
      tenantId: session.tenantId,
      deviceId: session.deviceId,
      refreshTokenHash: session.refreshTokenHash,
      version: session.version,
      revokedAt: session.revokedAt ? new Date(session.revokedAt) : null,
      expiresAt: new Date(session.expiresAt)
    }
  });

  return session;
}

async function getRefreshSession(userId: string, deviceId: string) {
  const prisma = getPrismaClient();
  if (!prisma) {
    return refreshSessions.get(sessionKey(userId, deviceId)) || null;
  }

  const session = await prisma.refreshSession.findUnique({
    where: {
      userId_deviceId: {
        userId,
        deviceId
      }
    }
  });

  if (!session) return null;
  return {
    userId: session.userId,
    tenantId: session.tenantId,
    deviceId: session.deviceId,
    refreshTokenHash: session.refreshTokenHash,
    version: session.version,
    revokedAt: session.revokedAt?.toISOString(),
    expiresAt: session.expiresAt.toISOString()
  } satisfies StoredRefreshSession;
}

async function revokeRefreshSessions(userId: string, deviceId?: string) {
  const prisma = getPrismaClient();
  if (!prisma) {
    if (deviceId) {
      const key = sessionKey(userId, deviceId);
      const session = refreshSessions.get(key);
      if (session) {
        session.revokedAt = new Date().toISOString();
        refreshSessions.set(key, session);
      }
      return;
    }

    for (const [key, session] of refreshSessions.entries()) {
      if (session.userId === userId) {
        session.revokedAt = new Date().toISOString();
        refreshSessions.set(key, session);
      }
    }
    return;
  }

  await prisma.refreshSession.updateMany({
    where: {
      userId,
      ...(deviceId ? { deviceId } : {})
    },
    data: {
      revokedAt: new Date()
    }
  });
}

export async function registerUser(input: { nome: string; email: string; senha: string; role?: AuthUserRole; plano?: AuthUserPlan }) {
  const email = normalizeEmail(input.email);

  const existing = hasDatabase() ? await getPersistentUserByEmail(email) : getMemoryUserByEmail(email);
  if (existing) {
    throw new Error('Já existe uma conta cadastrada com este e-mail.');
  }

  const plano = input.plano || planForRole(input.role || 'user');
  const role = input.role || roleForPlan(plano);
  const tenantNome = input.nome.trim() || email.split('@')[0];

  const user = await persistUserAndTenant({
    nome: input.nome.trim(),
    email,
    senhaHash: hashPassword(input.senha),
    role,
    plano,
    tenantNome
  });

  addAuditLog({
    origem: 'auth',
    mensagem: hasDatabase() ? 'Usuário registrado no banco.' : 'Usuário registrado em memória para ambiente local.',
    detalhes: { userId: user.id, email: user.email, role: user.role, plano: user.plano, tenantId: user.tenantId }
  });

  return issueSession(user);
}

export async function loginUser(input: { email: string; senha: string }) {
  const email = normalizeEmail(input.email);
  if (hasDatabase()) {
    await maybeSeedKnownAccount(email);
  }
  const user = hasDatabase() ? await getPersistentUserByEmail(email) : getMemoryUserByEmail(email);

  if (!user || !verifyPassword(input.senha, user.senhaHash)) {
    addSecurityLog('auth', 'Falha de autenticação.', { email });
    throw new Error('E-mail ou senha inválidos.');
  }

  addAuditLog({
    origem: 'auth',
    mensagem: 'Login bem-sucedido.',
    detalhes: { userId: user.id, email: user.email, role: user.role, tenantId: user.tenantId }
  });

  return issueSession(user);
}

export async function refreshSession(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);
  const user = hasDatabase() ? await getPersistentUserById(payload.sub) : getMemoryUserById(payload.sub);
  if (!user || !payload.deviceId) {
    addSecurityLog('auth', 'Tentativa de refresh token rejeitada.', { sub: payload.sub, version: payload.version });
    throw new Error('Refresh token inválido ou reutilizado.');
  }

  const session = await getRefreshSession(user.id, payload.deviceId);
  if (!session || !session.refreshTokenHash || session.revokedAt || !bcrypt.compareSync(refreshToken, session.refreshTokenHash) || payload.version !== session.version) {
    addSecurityLog('auth', 'Tentativa de refresh token rejeitada.', { sub: payload.sub, version: payload.version, deviceId: payload.deviceId });
    throw new Error('Refresh token inválido ou reutilizado.');
  }

  const nextVersion = session.version + 1;
  const updatedUser: StoredUser = { ...user, refreshTokenVersion: nextVersion };
  return issueSession(updatedUser, payload.deviceId);
}

export async function logoutUser(userId: string, deviceId?: string) {
  await revokeRefreshSessions(userId, deviceId);
  addAuditLog({
    origem: 'auth',
    mensagem: 'Logout executado.',
    detalhes: { userId, deviceId }
  });
}

export function verifyToken(token: string): AuthUser {
  const payload = verifyAccessToken(token);
  return {
    id: payload.sub,
    nome: payload.name,
    email: payload.email,
    plano: payload.plano,
    role: payload.role,
    tenantId: payload.tenantId,
    tenantNome: payload.tenantNome,
    deviceId: payload.deviceId
  };
}

export async function listUsers() {
  if (!hasDatabase()) {
    return [...usersById.values()].map(publicUser);
  }

  const prisma = getPrismaClient();
  if (!prisma) return [];

  const users = await prisma.user.findMany({
    include: { tenant: true },
    orderBy: { criadoEm: 'desc' }
  });

  return users.map((user) => ({
    id: user.id,
    nome: user.nome,
    email: user.email,
    plano: user.plano as AuthUserPlan,
    role: user.role as AuthUserRole,
    tenantId: user.tenantId,
    tenantNome: user.tenant.nome
  }));
}

export async function deleteUserAccount(userId: string) {
  if (!hasDatabase()) {
    const user = usersById.get(userId);
    if (!user) return false;
    usersByEmail.delete(user.email);
    usersById.delete(userId);
    for (const [key, session] of refreshSessions.entries()) {
      if (session.userId === userId) {
        refreshSessions.delete(key);
      }
    }
    return true;
  }

  const prisma = getPrismaClient();
  if (!prisma) return false;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return false;

  await prisma.$transaction([
    prisma.fileProcessingEvent.deleteMany({
      where: {
        arquivo: {
          tenantId: user.tenantId
        }
      }
    }),
    prisma.fileAsset.deleteMany({ where: { tenantId: user.tenantId } }),
    prisma.project.deleteMany({ where: { tenantId: user.tenantId } }),
    prisma.consentRecord.deleteMany({ where: { tenantId: user.tenantId } }),
    prisma.auditLog.deleteMany({ where: { tenantId: user.tenantId } }),
    prisma.securityLog.deleteMany({ where: { tenantId: user.tenantId } }),
    prisma.privacyRequest.deleteMany({ where: { tenantId: user.tenantId } }),
    prisma.apiKey.deleteMany({ where: { tenantId: user.tenantId } }),
    prisma.refreshSession.deleteMany({ where: { tenantId: user.tenantId } }),
    prisma.oAuthProviderOverride.deleteMany({ where: { tenantId: user.tenantId } }),
    prisma.user.delete({ where: { id: userId } }),
    prisma.organization.delete({ where: { id: user.tenantId } })
  ]);

  return true;
}

export function ensureDemoUser() {
  if (hasDatabase()) {
    return;
  }

  const email = 'demo@operix.local';
  if (!usersByEmail.has(email)) {
    void registerUser({
      nome: 'Usuário Demo',
      email,
      senha: 'operix123',
      role: 'dev',
      plano: 'DEV'
    });
  }
}

export function ensureBootstrapAdmin() {
  if (hasDatabase()) {
    return;
  }

  const email = config.bootstrapAdmin.email.trim().toLowerCase();
  if (!usersByEmail.has(email)) {
    void registerUser({
      nome: config.bootstrapAdmin.name,
      email,
      senha: config.bootstrapAdmin.password,
      role: 'admin',
      plano: 'EMPRESA'
    });
  }
}

export async function bootstrapPersistentAccounts() {
  if (!hasDatabase()) return;

  await registerPersistentAccount({
    nome: 'Usuário Demo',
    email: 'demo@operix.local',
    senha: 'operix123',
    role: 'dev',
    plano: 'DEV'
  });

  await registerPersistentAccount({
    nome: config.bootstrapAdmin.name,
    email: config.bootstrapAdmin.email,
    senha: config.bootstrapAdmin.password,
    role: 'admin',
    plano: 'EMPRESA'
  });
}

async function registerPersistentAccount(input: { nome: string; email: string; senha: string; role: AuthUserRole; plano: AuthUserPlan }) {
  const prisma = getPrismaClient();
  if (!prisma) return;
  const email = normalizeEmail(input.email);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;

  const tenant = await ensureTenant(input.nome.trim());
  const senhaHash = hashPassword(input.senha);
  await prisma.user.create({
    data: {
      nome: input.nome,
      email,
      senhaHash,
      plano: input.plano,
      role: input.role,
      tenantId: tenant.id
    }
  });
}

async function maybeSeedKnownAccount(email: string) {
  const normalized = normalizeEmail(email);
  if (normalized === 'demo@operix.local') {
    await registerPersistentAccount({
      nome: 'Usuário Demo',
      email: normalized,
      senha: 'operix123',
      role: 'dev',
      plano: 'DEV'
    });
  }

  if (normalized === config.bootstrapAdmin.email.trim().toLowerCase()) {
    await registerPersistentAccount({
      nome: config.bootstrapAdmin.name,
      email: normalized,
      senha: config.bootstrapAdmin.password,
      role: 'admin',
      plano: 'EMPRESA'
    });
  }
}

export async function getUserByEmail(email: string) {
  return hasDatabase() ? getPersistentUserByEmail(email) : getMemoryUserByEmail(email) || null;
}

export async function getUserById(id: string) {
  return hasDatabase() ? getPersistentUserById(id) : getMemoryUserById(id) || null;
}

export async function storeUserConsentAccepted(userId: string) {
  if (!hasDatabase()) {
    const user = usersById.get(userId);
    if (user) {
      user.consentedAt = new Date().toISOString();
      usersById.set(userId, user);
      usersByEmail.set(user.email, user);
    }
    return;
  }

  const prisma = getPrismaClient();
  if (!prisma) return;
  await prisma.user.update({
    where: { id: userId },
    data: { atualizadoEm: new Date() }
  });
}

export function getTokenVersionForDevice(userId: string, deviceId: string) {
  if (!hasDatabase()) {
    return refreshSessions.get(sessionKey(userId, deviceId))?.version || 1;
  }

  return 1;
}
