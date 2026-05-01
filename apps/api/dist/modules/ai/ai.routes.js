import { Router } from 'express';
import { z } from 'zod';
import { decideRuntime } from '@operix-mind/ai-runtime';
import { estimateTokens } from '@operix-mind/ai-agents';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { prepareBedrockCall } from './bedrock.service.js';
import { executeAiFlow, listAgents } from './ai.service.js';
import { analyzeDocumentRoute } from '../documents/documents.routes.js';
export const aiRouter = Router();
aiRouter.get('/agents', (_req, res) => {
    res.json({ dados: listAgents() });
});
aiRouter.post('/execute', authMiddleware, validateBody(z.object({ mensagem: z.string().trim().min(1).max(12000) })), async (req, res, next) => {
    try {
        const resultado = await executeAiFlow({ mensagem: req.body.mensagem, userId: req.user.id });
        res.json({ dados: resultado });
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Limite de uso de IA')) {
            res.status(429).json({ mensagem: error.message });
            return;
        }
        next(error);
    }
});
aiRouter.post('/analyze-document', ...analyzeDocumentRoute);
aiRouter.post('/premium/estimate', authMiddleware, requirePermission('ai:premium'), validateBody(z.object({ prompt: z.string().trim().min(1).max(12000) })), (req, res) => {
    const prompt = req.body.prompt;
    res.json({ dados: prepareBedrockCall({ user: req.user, prompt }) });
});
aiRouter.post('/runtime/decide', authMiddleware, validateBody(z.object({
    prompt: z.string().trim().min(1).max(12000),
    tipo: z.string().trim().min(1).max(60).default('conversa'),
    requerAltaPrecisao: z.boolean().optional(),
    documentoGrande: z.boolean().optional(),
    debugDificil: z.boolean().optional(),
    device: z.object({
        tipoDispositivo: z.enum(['mobile', 'desktop', 'tablet', 'desconhecido']).default('desconhecido'),
        memoriaGb: z.number().nonnegative().default(0),
        navegador: z.string().default(''),
        sistemaOperacional: z.string().default(''),
        suportaWebGPU: z.boolean().default(false),
        suportaWasm: z.boolean().default(false),
        modoEconomia: z.boolean().default(false)
    }).default({
        tipoDispositivo: 'desconhecido',
        memoriaGb: 0,
        navegador: '',
        sistemaOperacional: '',
        suportaWebGPU: false,
        suportaWasm: false,
        modoEconomia: false
    })
})), (req, res) => {
    const { prompt, device } = req.body;
    const decision = decideRuntime({
        tipo: req.body.tipo,
        prompt,
        tokensEstimados: estimateTokens(prompt),
        requerAltaPrecisao: Boolean(req.body.requerAltaPrecisao),
        documentoGrande: Boolean(req.body.documentoGrande),
        debugDificil: Boolean(req.body.debugDificil)
    }, device, req.user.plano);
    res.json({ dados: decision });
});
