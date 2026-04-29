import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { config } from '../../config/config.service.js';
import { addAuditLog, addSecurityLog } from '../logs/logs.service.js';
import { hashPassword, verifyPassword } from './password.service.js';
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from './jwt.service.js';
const usersByEmail = new Map();
const usersById = new Map();
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
function publicUser(user) {
    return {
        id: user.id,
        nome: user.nome,
        email: user.email,
        plano: user.plano,
        role: user.role
    };
}
function roleForPlan(plan) {
    if (plan === 'DEV')
        return 'dev';
    if (plan === 'EMPRESA')
        return 'enterprise';
    if (plan === 'ENGENHARIA')
        return 'enterprise';
    if (plan === 'PRO')
        return 'user';
    return 'user';
}
function planForRole(role) {
    if (role === 'dev')
        return 'DEV';
    if (role === 'enterprise')
        return 'EMPRESA';
    if (role === 'admin')
        return 'EMPRESA';
    return 'GRATIS';
}
function issueSession(user) {
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
export function registerUser(input) {
    const email = normalizeEmail(input.email);
    if (usersByEmail.has(email)) {
        throw new Error('Já existe uma conta cadastrada com este e-mail.');
    }
    const user = {
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
export function loginUser(input) {
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
export function refreshSession(refreshToken) {
    const payload = verifyRefreshToken(refreshToken);
    const user = usersById.get(payload.sub);
    if (!user || !user.refreshTokenHash || !bcrypt.compareSync(refreshToken, user.refreshTokenHash) || payload.version !== user.refreshTokenVersion) {
        addSecurityLog('auth', 'Tentativa de refresh token rejeitada.', { sub: payload.sub, version: payload.version });
        throw new Error('Refresh token inválido ou reutilizado.');
    }
    user.refreshTokenVersion += 1;
    return issueSession(user);
}
export function logoutUser(userId) {
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
export function verifyToken(token) {
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
export function deleteUserAccount(userId) {
    const user = usersById.get(userId);
    if (!user)
        return false;
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
