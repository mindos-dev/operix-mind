import type { RequestHandler } from 'express';

export const requireSecureOrigin: RequestHandler = (req, res, next) => {
  if (req.method === 'GET' || req.method === 'OPTIONS') {
    next();
    return;
  }

  if (req.path.startsWith('/api/auth/login') || req.path.startsWith('/api/auth/register')) {
    next();
    return;
  }

  const origin = req.headers.origin || req.headers.referer || '';
  const hasAuthorization = Boolean(req.headers.authorization);
  if (!origin && !hasAuthorization) {
    res.status(403).json({ mensagem: 'Origem não permitida.' });
    return;
  }

  if (origin && !String(origin).startsWith('http://localhost') && !String(origin).startsWith('https://')) {
    res.status(403).json({ mensagem: 'Origem não permitida.' });
    return;
  }

  next();
};
