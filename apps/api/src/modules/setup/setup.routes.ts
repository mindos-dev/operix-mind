import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../../middleware/validate.middleware.js';
import { createSetupAdmin, getSetupStatus, validateAwsConnection, validateDatabaseConnection, validateEmailConnection, validateStorageConnection } from './setup.service.js';
import { config } from '../../config/config.service.js';

export const setupRouter = Router();

const adminSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  senha: z.string().min(8).max(128),
  setupToken: z.string().optional()
});

setupRouter.get('/status', (_req, res) => {
  Promise.resolve(getSetupStatus()).then((dados) => res.json({ dados }));
});

setupRouter.post('/admin', validateBody(adminSchema), (req, res) => {
  Promise.resolve(createSetupAdmin(req.body)).then((dados) => res.status(201).json({ dados })).catch((error) => {
    res.status(400).json({ mensagem: error instanceof Error ? error.message : 'Erro ao criar admin inicial.' });
  });
});

setupRouter.post('/validate-database', (_req, res) => {
  Promise.resolve(validateDatabaseConnection()).then((dados) => res.json({ dados })).catch((error) => {
    res.status(500).json({ mensagem: error instanceof Error ? error.message : 'Erro ao validar banco.' });
  });
});

setupRouter.post('/validate-storage', (_req, res) => {
  Promise.resolve(validateStorageConnection()).then((dados) => res.json({ dados })).catch((error) => {
    res.status(500).json({ mensagem: error instanceof Error ? error.message : 'Erro ao validar storage.' });
  });
});

setupRouter.post('/validate-aws', (_req, res) => {
  Promise.resolve(validateAwsConnection()).then((dados) => res.json({ dados })).catch((error) => {
    res.status(500).json({ mensagem: error instanceof Error ? error.message : 'Erro ao validar AWS.' });
  });
});

setupRouter.post('/validate-email', (_req, res) => {
  Promise.resolve(validateEmailConnection()).then((dados) => res.json({ dados })).catch((error) => {
    res.status(500).json({ mensagem: error instanceof Error ? error.message : 'Erro ao validar SMTP.' });
  });
});

setupRouter.get('/token', (_req, res) => {
  res.json({ dados: { configured: Boolean(config.setupToken) } });
});
