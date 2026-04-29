import { createTaskContext } from './context-builder.js';
import { estimateCost, estimateTokens, logTokenUsage, trimPrompt } from './token-economy.js';
export function createMockedAgent(config) {
    async function buildResponse(request, prefix) {
        const context = trimPrompt(createTaskContext(request), config.limiteTokens);
        const output = [
            `${prefix} ${config.nome}`,
            '',
            `Função aplicada: ${config.funcao}`,
            `Modelo configurado: ${config.modelo}`,
            '',
            'Plano de resposta:',
            '- Interpretar o pedido com foco no entregável final.',
            '- Usar somente o contexto necessário para economizar tokens.',
            '- Registrar decisões, riscos e próximos passos.',
            '',
            'Contexto recebido:',
            context
        ].join('\n');
        const estimatedTokens = estimateTokens(`${config.promptBase}\n${context}\n${output}`);
        const estimatedCostUsd = estimateCost(estimatedTokens, config.custoEstimadoUsdPor1kTokens);
        logTokenUsage({
            agentName: config.nome,
            model: config.modelo,
            taskType: request.taskType,
            tokens: estimatedTokens,
            estimatedCostUsd,
            createdAt: new Date().toISOString()
        });
        return {
            agentName: config.nome,
            model: config.modelo,
            taskType: request.taskType,
            output,
            estimatedTokens,
            estimatedCostUsd,
            warnings: ['Execução inicial em modo mock. Conectores reais entram via providers.']
        };
    }
    return {
        ...config,
        execute: (request) => buildResponse(request, 'Execução coordenada por'),
        review: (content) => buildResponse({ input: content, taskType: 'revisao', language: 'pt-BR' }, 'Revisão técnica por'),
        summarize: (content) => buildResponse({ input: content, taskType: 'resumo', language: 'pt-BR' }, 'Resumo técnico por')
    };
}
