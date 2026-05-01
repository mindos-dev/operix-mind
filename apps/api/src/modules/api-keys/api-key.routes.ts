import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { createApiKey, listApiKeys, removeApiKey, rotateApiKey } from './api-key.service.js';

export const apiKeyRouter = Router();

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  scopes: z.array(z.string().trim().min(1).max(80)).default([]),
  expiresAt: z.string().datetime().optional()
});

apiKeyRouter.use(authMiddleware);

apiKeyRouter.get('/', (req, res) => {
  Promise.resolve(listApiKeys(req.user!)).then((dados) => res.json({ dados }));
});

apiKeyRouter.post('/', validateBody(createSchema), (req, res) => {
  Promise.resolve(createApiKey(req.user!, req.body)).then((dados) => res.status(201).json({ dados }));
});

apiKeyRouter.post('/:id/rotate', (req, res) => {
  Promise.resolve(rotateApiKey(req.user!, String(req.params.id || ''))).then((dados) => res.json({ dados }));
});

apiKeyRouter.delete('/:id', (req, res) => {
  Promise.resolve(removeApiKey(req.user!, String(req.params.id || ''))).then((dados) => res.json({ dados }));
});
