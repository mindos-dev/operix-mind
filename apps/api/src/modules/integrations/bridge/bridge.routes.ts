import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../../../middleware/auth.middleware.js';
import { validateBody } from '../../../middleware/validate.middleware.js';
import { sendBridgeInstruction } from './bridge.service.js';

export const bridgeRouter = Router();

const bridgeBodySchema = z.object({
  action: z.enum(['generate_stl', 'generate_gcode', 'cad_sync', 'bom_sync']),
  file: z.string().optional(),
  params: z.record(z.unknown()).optional()
});

bridgeRouter.post(
  '/integrate',
  authMiddleware,
  validateBody(bridgeBodySchema),
  async (req, res, next) => {
    try {
      const result = await sendBridgeInstruction({
        userId: req.user?.id,
        tenantId: req.user?.tenantId,
        ...req.body
      });

      res.json({ dados: result });
    } catch (error) {
      next(error);
    }
  }
);
