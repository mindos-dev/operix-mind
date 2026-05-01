import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { exportUserData, deleteUserData, getConsentRequest, registerUserConsent } from './privacy.service.js';

export const privacyRouter = Router();

privacyRouter.use(authMiddleware);

privacyRouter.get('/consent/:scope', (req, res) => {
  const scope = String(req.params.scope || '');
  if (!['processing', 'ai_assistance', 'storage', 'analytics', 'marketing'].includes(scope)) {
    res.status(400).json({ mensagem: 'Escopo de consentimento inválido.' });
    return;
  }
  res.json({ dados: getConsentRequest(scope as Parameters<typeof getConsentRequest>[0]) });
});

privacyRouter.post('/consent', validateBody(z.object({
  scope: z.enum(['processing', 'ai_assistance', 'storage', 'analytics', 'marketing']),
  accepted: z.boolean(),
  version: z.string().min(1).default('1.0')
})), (req, res) => {
  Promise.resolve(registerUserConsent(req.user!.id, req.user!.tenantId, req.body.scope, req.body.accepted, req.body.version))
    .then((dados) => res.status(201).json({ dados }))
    .catch((error) => res.status(400).json({ mensagem: error instanceof Error ? error.message : 'Erro ao registrar consentimento.' }));
});

privacyRouter.get('/export', requirePermission('privacy:export'), (req, res) => {
  Promise.resolve(exportUserData(req.user!.id))
    .then((dados) => res.json({ dados }))
    .catch((error) => res.status(500).json({ mensagem: error instanceof Error ? error.message : 'Erro ao exportar dados.' }));
});

privacyRouter.delete('/delete', requirePermission('privacy:delete'), (req, res) => {
  Promise.resolve(deleteUserData(req.user!.id))
    .then((deleted) => res.status(deleted ? 204 : 404).send())
    .catch((error) => res.status(500).json({ mensagem: error instanceof Error ? error.message : 'Erro ao excluir dados.' }));
});
