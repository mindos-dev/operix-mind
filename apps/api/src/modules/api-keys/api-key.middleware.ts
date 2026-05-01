import type { RequestHandler } from 'express';
import { validateApiKeyValue } from './api-key.service.js';

declare global {
  namespace Express {
    interface Request {
      apiKeyInfo?: Awaited<ReturnType<typeof validateApiKeyValue>>;
    }
  }
}

export const apiKeyAuthMiddleware: RequestHandler = async (req, res, next) => {
  const header = req.headers.authorization;
  const bearer = header?.startsWith('Bearer ') ? header.slice(7) : '';
  const apiKey = bearer || String(req.headers['x-api-key'] || '');

  if (!apiKey) {
    res.status(401).json({ mensagem: 'API key não informada.' });
    return;
  }

  const validated = await validateApiKeyValue(apiKey);
  if (!validated) {
    res.status(401).json({ mensagem: 'API key inválida ou expirada.' });
    return;
  }

  req.apiKeyInfo = validated;
  next();
};
