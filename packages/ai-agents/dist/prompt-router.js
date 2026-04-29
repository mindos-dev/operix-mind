import { bedrockAgent } from './bedrock.agent.js';
import { deepClawAgent } from './deep-claw.agent.js';
import { deepseekAgent } from './deepseek.agent.js';
import { gemmaAgent } from './gemma.agent.js';
import { ollamaAgent } from './ollama.agent.js';
import { logAgentDecision, selectCheapestCapableModel } from './token-economy.js';
export const configuredAgents = [
    deepClawAgent,
    deepseekAgent,
    gemmaAgent,
    ollamaAgent,
    bedrockAgent
];
export function routePrompt(request) {
    const input = request.input.toLowerCase();
    if (request.taskType === 'coordenacao')
        return logRoute(deepClawAgent, 'coordenação geral solicitada');
    if (request.taskType === 'traducao' || request.taskType === 'resumo' || request.taskType === 'documentacao') {
        return logRoute(gemmaAgent, 'tarefa de prompt, tradução, resumo ou documentação');
    }
    if (request.taskType === 'debug' || input.includes('erro') || input.includes('bug')) {
        return logRoute(deepseekAgent, 'debug ou análise técnica complexa detectada');
    }
    if (request.taskType === 'devops' || input.includes('aws') || input.includes('deploy') || input.includes('escala')) {
        return logRoute(bedrockAgent, 'tarefa de nuvem, deploy ou escala detectada');
    }
    if (request.taskType === 'codigo') {
        return logRoute(deepseekAgent, 'geração ou planejamento de código exige análise técnica');
    }
    if (request.taskType === 'local' || input.includes('offline') || input.includes('ollama')) {
        return logRoute(ollamaAgent, 'tarefa local ou offline detectada');
    }
    if (request.taskType === 'arquitetura' || input.includes('arquitetura')) {
        return logRoute(deepseekAgent, 'arquitetura complexa detectada');
    }
    return selectCheapestCapableModel(configuredAgents, request.taskType);
}
export async function executeRoutedPrompt(request) {
    const agent = routePrompt(request);
    return agent.execute(request);
}
function logRoute(agent, reason) {
    logAgentDecision({
        etapa: 'roteamento',
        agente: agent.nome,
        decisao: 'agente_escolhido',
        detalhe: `${agent.nome} selecionado: ${reason}.`
    });
    return agent;
}
