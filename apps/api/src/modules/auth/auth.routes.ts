import { Router, type Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { loginUser, logoutUser, refreshSession, registerUser } from './auth.service.js';
import { exportOAuthDiagnostics, finishOAuthLogin, getOAuthRuntimeSummary, type OAuthProvider, listOAuthProviders, prepareOAuthLogin, resetAllOAuthProviders, resetOAuthProvider, updateOAuthProvider } from './oauth.service.js';
import { config } from '../../config/config.service.js';

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
  refreshToken: z.string().min(20).optional()
});

const oauthProviderSchema = z.enum(['google', 'github', 'azure']);
const oauthCallbackSchema = z.object({
  provider: oauthProviderSchema,
  state: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  mock: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().trim().min(2).max(120).optional(),
  sub: z.string().trim().min(2).max(200).optional()
});

const oauthUpdateSchema = z.object({
  enabled: z.boolean()
});

const oauthResetAllSchema = z.object({
  confirmed: z.boolean().refine(Boolean, { message: 'Confirmação obrigatória.' })
});

function refreshCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: config.nodeEnv === 'production',
    path: '/api/auth',
    maxAge: 30 * 24 * 60 * 60 * 1000
  };
}

function setSessionCookies(res: Response, refreshToken: string) {
  res.cookie('mind_ia_refresh', refreshToken, refreshCookieOptions());
}

authRouter.post('/register', validateBody(registerSchema), async (req, res) => {
  try {
    const dados = await registerUser(req.body);
    setSessionCookies(res, dados.refreshToken);
    res.status(201).json({ dados });
  } catch (error) {
    res.status(400).json({ mensagem: error instanceof Error ? error.message : 'Erro ao registrar usuário.' });
  }
});

authRouter.post('/login', validateBody(loginSchema), async (req, res) => {
  try {
    const dados = await loginUser(req.body);
    setSessionCookies(res, dados.refreshToken);
    res.json({ dados });
  } catch (error) {
    res.status(401).json({ mensagem: error instanceof Error ? error.message : 'Erro ao autenticar usuário.' });
  }
});

authRouter.post('/refresh', validateBody(refreshSchema), (req, res) => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies?.mind_ia_refresh;
    if (!refreshToken) {
      res.status(401).json({ mensagem: 'Refresh token não informado.' });
      return;
    }

    Promise.resolve(refreshSession(String(refreshToken))).then((dados) => {
      setSessionCookies(res, dados.refreshToken);
      res.json({ dados });
    }).catch((error) => {
      res.status(401).json({ mensagem: error instanceof Error ? error.message : 'Refresh token inválido.' });
    });
  } catch (error) {
    res.status(401).json({ mensagem: error instanceof Error ? error.message : 'Refresh token inválido.' });
  }
});

authRouter.post('/logout', authMiddleware, (req, res) => {
  Promise.resolve(logoutUser(req.user!.id, req.user!.deviceId)).then(() => {
    res.clearCookie('mind_ia_refresh', refreshCookieOptions());
    res.status(204).send();
  });
});

authRouter.get('/me', authMiddleware, (req, res) => {
  res.json({ dados: req.user });
});

authRouter.get('/oauth/providers', (_req, res) => {
  Promise.resolve(listOAuthProviders()).then((dados) => res.json({ dados }));
});

authRouter.get('/oauth/summary', (_req, res) => {
  Promise.resolve(getOAuthRuntimeSummary()).then((dados) => res.json({ dados }));
});

authRouter.get('/oauth/export', authMiddleware, requireRole(['admin', 'enterprise']), (_req, res) => {
  Promise.resolve(exportOAuthDiagnostics()).then((dados) => res.json({ dados }));
});

authRouter.patch('/oauth/providers/:provider', authMiddleware, requireRole(['admin', 'enterprise']), validateBody(oauthUpdateSchema), (req, res) => {
  const parsed = oauthProviderSchema.safeParse(req.params.provider);
  if (!parsed.success) {
    res.status(400).json({ mensagem: 'Provedor OAuth inválido.' });
    return;
  }

  Promise.resolve(updateOAuthProvider(parsed.data as OAuthProvider, req.body.enabled, req.user?.email))
    .then((dados) => res.json({ dados }));
});

authRouter.delete('/oauth/providers/:provider/override', authMiddleware, requireRole(['admin', 'enterprise']), (req, res) => {
  const parsed = oauthProviderSchema.safeParse(req.params.provider);
  if (!parsed.success) {
    res.status(400).json({ mensagem: 'Provedor OAuth inválido.' });
    return;
  }

  Promise.resolve(resetOAuthProvider(parsed.data as OAuthProvider, req.user?.email))
    .then((dados) => res.json({ dados }));
});

authRouter.post('/oauth/reset-all', authMiddleware, requireRole(['admin', 'enterprise']), validateBody(oauthResetAllSchema), (req, res) => {
  Promise.resolve(resetAllOAuthProviders(req.user?.email)).then((dados) => res.json({ dados }));
});

authRouter.get('/oauth/:provider/start', (req, res) => {
  const parsed = oauthProviderSchema.safeParse(req.params.provider);
  if (!parsed.success) {
    res.status(400).json({ mensagem: 'Provedor OAuth inválido.' });
    return;
  }

  const provider = parsed.data as OAuthProvider;
  const redirectUri = String(req.query.redirectUri || `${config.corsOrigin}/oauth/callback`);
  Promise.resolve(prepareOAuthLogin(provider, redirectUri)).then((dados) => res.json({ dados }));
});

authRouter.get('/oauth/:provider/callback', (req, res) => {
  const parsed = oauthCallbackSchema.safeParse({
    provider: req.params.provider,
    state: req.query.state,
    code: req.query.code,
    mock: req.query.mock,
    email: req.query.email,
    name: req.query.name,
    sub: req.query.sub
  });
  if (!parsed.success) {
    res.status(400).json({ mensagem: 'Provedor OAuth inválido.' });
    return;
  }

  const profileEmail = parsed.data.email || `${parsed.data.provider}@mind.local`;
  Promise.resolve(finishOAuthLogin(parsed.data.provider, {
    email: profileEmail,
    name: parsed.data.name || `${parsed.data.provider.toUpperCase()} User`,
    sub: parsed.data.sub || `${parsed.data.provider}:${profileEmail}`
  })).then((dados) => {
    setSessionCookies(res, dados.refreshToken);
    res.json({
      dados: {
        ...dados,
        provider: parsed.data.provider,
        status: 'autenticado',
        message: parsed.data.mock
          ? 'Login OAuth2 executado em modo demo local.'
          : 'Fluxo OAuth2 concluído em modo preparado.'
      }
    });
  });
});
