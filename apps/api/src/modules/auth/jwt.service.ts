import jwt from 'jsonwebtoken';
import { config } from '../../config/config.service.js';
import type { AuthTokenPayload, AuthUser } from './auth.service.js';

function accessPayload(user: AuthUser): AuthTokenPayload {
  return {
    sub: user.id,
    email: user.email,
    role: user.role,
    plano: user.plano,
    type: 'access'
  };
}

function refreshPayload(user: AuthUser, version: number): AuthTokenPayload {
  return {
    sub: user.id,
    email: user.email,
    role: user.role,
    plano: user.plano,
    type: 'refresh',
    version
  };
}

export function signAccessToken(user: AuthUser): string {
  return jwt.sign(accessPayload(user), config.jwt.accessSecret, { expiresIn: config.jwt.accessTtl as jwt.SignOptions['expiresIn'] });
}

export function signRefreshToken(user: AuthUser, version: number): string {
  return jwt.sign(refreshPayload(user, version), config.jwt.refreshSecret, { expiresIn: config.jwt.refreshTtl as jwt.SignOptions['expiresIn'] });
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  const payload = jwt.verify(token, config.jwt.accessSecret) as AuthTokenPayload;
  if (payload.type !== 'access') throw new Error('Token de acesso inválido.');
  return payload;
}

export function verifyRefreshToken(token: string): AuthTokenPayload {
  const payload = jwt.verify(token, config.jwt.refreshSecret) as AuthTokenPayload;
  if (payload.type !== 'refresh') throw new Error('Refresh token inválido.');
  return payload;
}
