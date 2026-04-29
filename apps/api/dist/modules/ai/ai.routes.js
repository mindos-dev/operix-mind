import { Router } from 'express';
import { decideRuntime } from '@operix-mind/ai-runtime';
import { estimateTokens } from '@operix-mind/ai-agents';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { prepareBedrockCall } from './bedrock.service.js';
import { executeAiFlow, listAgents } from './ai.service.js';
export const aiRouter = Router();
aiRouter.get('/agents', (_req, res) => {
    res.json({ dados: listAgents() });
});
aiRouter.post('/execute', async (req, res, next) => {
    try {
        const mensagem = String(req.body?.mensagem || '').trim();
        if (!mensagem) {
            res.status(400).json({ mensagem: 'Informe uma mensagem para o console de IA.' });
            return;
        }
        const resultado = await executeAiFlow({ mensagem });
        res.json({ dados: resultado });
    }
    catch (error) {
        next(error);
    }
});
aiRouter.post('/premium/estimate', authMiddleware, (req, res) => {
    const prompt = String(req.body?.prompt || '').trim();
    if (!prompt) {
        res.status(400).json({ mensagem: 'Informe o prompt para estimar custo premium.' });
        return;
    }
    res.json({ dados: prepareBedrockCall({ user: req.user, prompt }) });
});
aiRouter.post('/runtime/decide', authMiddleware, (req, res) => {
    const prompt = String(req.body?.prompt || '').trim();
    const device = req.body?.device || {};
    if (!prompt) {
        res.status(400).json({ mensagem: 'Informe o prompt para decidir o runtime.' });
        return;
    }
    const decision = decideRuntime({
        tipo: String(req.body?.tipo || 'conversa'),
        prompt,
        tokensEstimados: estimateTokens(prompt),
        requerAltaPrecisao: Boolean(req.body?.requerAltaPrecisao),
        documentoGrande: Boolean(req.body?.documentoGrande),
        debugDificil: Boolean(req.body?.debugDificil)
    }, {
        tipoDispositivo: device.tipoDispositivo || 'desconhecido',
        memoriaGb: Number(device.memoriaGb || 0),
        navegador: String(device.navegador || ''),
        sistemaOperacional: String(device.sistemaOperacional || ''),
        suportaWebGPU: Boolean(device.suportaWebGPU),
        suportaWasm: Boolean(device.suportaWasm),
        modoEconomia: Boolean(device.modoEconomia)
    }, req.user.plano);
    res.json({ dados: decision });
});
