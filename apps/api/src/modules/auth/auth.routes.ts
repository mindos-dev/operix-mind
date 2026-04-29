import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { loginUser, registerUser } from './auth.service.js';

export const authRouter = Router();

authRouter.post('/register', (req, res) => {
  try {
    const nome = String(req.body?.nome || '').trim();
    const email = String(req.body?.email || '').trim();
    const senha = String(req.body?.senha || '');

    if (!nome || !email || senha.length < 6) {
      res.status(400).json({ mensagem: 'Informe nome, e-mail e senha com pelo menos 6 caracteres.' });
      return;
    }

    res.status(201).json({ dados: registerUser({ nome, email, senha }) });
  } catch (error) {
    res.status(400).json({ mensagem: error instanceof Error ? error.message : 'Erro ao registrar usuário.' });
  }
});

authRouter.post('/login', (req, res) => {
  try {
    const email = String(req.body?.email || '').trim();
    const senha = String(req.body?.senha || '');
    res.json({ dados: loginUser({ email, senha }) });
  } catch (error) {
    res.status(401).json({ mensagem: error instanceof Error ? error.message : 'Erro ao autenticar usuário.' });
  }
});

authRouter.get('/me', authMiddleware, (req, res) => {
  res.json({ dados: req.user });
});
