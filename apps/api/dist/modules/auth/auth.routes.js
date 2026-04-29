import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { loginUser, logoutUser, refreshSession, registerUser } from './auth.service.js';
export const authRouter = Router();
const registerSchema = z.object({
    nome: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(200),
    senha: z.string().min(8).max(128),
    role: z.enum(['admin', 'user', 'dev', 'enterprise']).optional()
});
const loginSchema = z.object({
    email: z.string().trim().email().max(200),
    senha: z.string().min(1).max(128)
});
const refreshSchema = z.object({
    refreshToken: z.string().min(20)
});
authRouter.post('/register', validateBody(registerSchema), async (req, res) => {
    try {
        const dados = await registerUser(req.body);
        res.status(201).json({ dados });
    }
    catch (error) {
        res.status(400).json({ mensagem: error instanceof Error ? error.message : 'Erro ao registrar usuário.' });
    }
});
authRouter.post('/login', validateBody(loginSchema), async (req, res) => {
    try {
        const dados = await loginUser(req.body);
        res.json({ dados });
    }
    catch (error) {
        res.status(401).json({ mensagem: error instanceof Error ? error.message : 'Erro ao autenticar usuário.' });
    }
});
authRouter.post('/refresh', validateBody(refreshSchema), (req, res) => {
    try {
        res.json({ dados: refreshSession(req.body.refreshToken) });
    }
    catch (error) {
        res.status(401).json({ mensagem: error instanceof Error ? error.message : 'Refresh token inválido.' });
    }
});
authRouter.post('/logout', authMiddleware, (req, res) => {
    logoutUser(req.user.id);
    res.status(204).send();
});
authRouter.get('/me', authMiddleware, (req, res) => {
    res.json({ dados: req.user });
});
