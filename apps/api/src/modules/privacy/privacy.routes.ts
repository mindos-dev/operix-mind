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
  res.status(201).json({ dados: registerUserConsent(req.user!.id, req.body.scope, req.body.accepted, req.body.version) });
});

privacyRouter.get('/export', requirePermission('privacy:export'), (req, res) => {
  res.json({ dados: exportUserData(req.user!.id) });
});

privacyRouter.delete('/delete', requirePermission('privacy:delete'), (req, res) => {
  const deleted = deleteUserData(req.user!.id);
  res.status(deleted ? 204 : 404).send();
});
