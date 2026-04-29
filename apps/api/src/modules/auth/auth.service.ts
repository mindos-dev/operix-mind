import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { config } from '../../config/config.service.js';
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
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: AuthUserRole;
  plano: AuthUserPlan;
  type: 'access' | 'refresh';
  version?: number;
}

interface StoredUser extends AuthUser {
  senhaHash: string;
  consentedAt?: string;
  refreshTokenHash?: string;
  refreshTokenVersion: number;
}

const usersByEmail = new Map<string, StoredUser>();
const usersById = new Map<string, StoredUser>();

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function publicUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    plano: user.plano,
    role: user.role
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

function issueSession(user: StoredUser) {
  const usuario = publicUser(user);
  const accessToken = signAccessToken(usuario);
  const refreshToken = signRefreshToken(usuario, user.refreshTokenVersion);
  user.refreshTokenHash = bcrypt.hashSync(refreshToken, bcrypt.genSaltSync(8));
  addSecurityLog('auth', 'Sessão emitida.', { userId: user.id, role: user.role, plano: user.plano });
  return {
    usuario,
    accessToken,
    refreshToken,
    token: accessToken,
    expiresIn: config.jwt.accessTtl
  };
}

export function registerUser(input: { nome: string; email: string; senha: string; role?: AuthUserRole; plano?: AuthUserPlan }) {
  const email = normalizeEmail(input.email);

  if (usersByEmail.has(email)) {
    throw new Error('Já existe uma conta cadastrada com este e-mail.');
  }

  const user: StoredUser = {
    id: randomUUID(),
    nome: input.nome.trim(),
    email,
    plano: input.plano || planForRole(input.role || 'user'),
    role: input.role || roleForPlan(input.plano || planForRole(input.role || 'user')),
    senhaHash: hashPassword(input.senha),
    consentedAt: new Date().toISOString(),
    refreshTokenVersion: 1
  };

  usersByEmail.set(email, user);
  usersById.set(user.id, user);

  addAuditLog({
    origem: 'auth',
    mensagem: 'Usuário registrado em memória para ambiente local.',
    detalhes: { userId: user.id, email: user.email, role: user.role, plano: user.plano }
  });

  return issueSession(user);
}

export function loginUser(input: { email: string; senha: string }) {
  const email = normalizeEmail(input.email);
  const user = usersByEmail.get(email);

  if (!user || !verifyPassword(input.senha, user.senhaHash)) {
    addSecurityLog('auth', 'Falha de autenticação.', { email });
    throw new Error('E-mail ou senha inválidos.');
  }

  addAuditLog({
    origem: 'auth',
    mensagem: 'Login bem-sucedido.',
    detalhes: { userId: user.id, email: user.email, role: user.role }
  });

  return issueSession(user);
}

export function refreshSession(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);
  const user = usersById.get(payload.sub);

  if (!user || !user.refreshTokenHash || !bcrypt.compareSync(refreshToken, user.refreshTokenHash) || payload.version !== user.refreshTokenVersion) {
    addSecurityLog('auth', 'Tentativa de refresh token rejeitada.', { sub: payload.sub, version: payload.version });
    throw new Error('Refresh token inválido ou reutilizado.');
  }

  user.refreshTokenVersion += 1;
  return issueSession(user);
}

export function logoutUser(userId: string) {
  const user = usersById.get(userId);
  if (user) {
    user.refreshTokenHash = undefined;
    addAuditLog({
      origem: 'auth',
      mensagem: 'Logout executado.',
      detalhes: { userId }
    });
  }
}

export function verifyToken(token: string): AuthUser {
  const payload = verifyAccessToken(token);
  const user = usersById.get(payload.sub);

  if (!user) {
    throw new Error('Usuário não encontrado.');
  }

  return publicUser(user);
}

export function listUsers() {
  return [...usersById.values()].map(publicUser);
}

export function deleteUserAccount(userId: string) {
  const user = usersById.get(userId);
  if (!user) return false;

  usersByEmail.delete(user.email);
  usersById.delete(userId);
  return true;
}

export function ensureDemoUser() {
  const email = 'demo@operix.local';
  if (!usersByEmail.has(email)) {
    registerUser({
      nome: 'Usuário Demo',
      email,
      senha: 'operix123',
      role: 'dev',
      plano: 'DEV'
    });
  }
}
