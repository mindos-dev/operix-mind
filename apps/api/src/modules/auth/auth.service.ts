import { createHash, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { addLog } from '../logs/logs.service.js';

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  plano: 'GRATIS' | 'PRO' | 'ENGENHARIA' | 'DEV' | 'EMPRESA';
}

interface StoredUser extends AuthUser {
  senhaHash: string;
}

const users = new Map<string, StoredUser>();

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

function publicUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    plano: user.plano
  };
}

function createToken(user: AuthUser): string {
  return jwt.sign(user, env.jwtSecret, { expiresIn: '8h' });
}

export function registerUser(input: { nome: string; email: string; senha: string }) {
  const email = input.email.trim().toLowerCase();

  if (users.has(email)) {
    throw new Error('Já existe uma conta cadastrada com este e-mail.');
  }

  const user: StoredUser = {
    id: randomUUID(),
    nome: input.nome.trim(),
    email,
    plano: 'DEV',
    senhaHash: hashPassword(input.senha)
  };

  users.set(email, user);

  addLog({
    level: 'sucesso',
    origem: 'auth',
    mensagem: 'Usuário registrado em memória para ambiente local.',
    detalhes: { email }
  });

  const usuario = publicUser(user);
  return { usuario, token: createToken(usuario) };
}

export function loginUser(input: { email: string; senha: string }) {
  const email = input.email.trim().toLowerCase();
  const user = users.get(email);

  if (!user || user.senhaHash !== hashPassword(input.senha)) {
    throw new Error('E-mail ou senha inválidos.');
  }

  const usuario = publicUser(user);
  return { usuario, token: createToken(usuario) };
}

export function verifyToken(token: string): AuthUser {
  return jwt.verify(token, env.jwtSecret) as AuthUser;
}

export function ensureDemoUser() {
  const email = 'demo@operix.local';
  if (!users.has(email)) {
    registerUser({
      nome: 'Usuário Demo',
      email,
      senha: 'operix123'
    });
  }
}
