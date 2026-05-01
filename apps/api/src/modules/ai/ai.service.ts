import {
  clearAgentExecutionLogs,
  configuredAgents,
  createDeepClawPlan,
  executeRoutedPrompt,
  formatFinalAnswerPortuguese,
  getAgentExecutionLogs,
  getTokenUsageLogs,
  estimateTokens
} from '@operix-mind/ai-agents';
import { config } from '../../config/config.service.js';
import { addAuditLog, addSecurityLog } from '../logs/logs.service.js';
import { recordAiRequest } from '../observability/observability.service.js';
import { detectPromptInjection, limitContext, logAiUsage, registerAiUsage, sanitizePrompt } from '../security/ai-security.service.js';

export interface ExecuteAiInput {
  mensagem: string;
  userId?: string;
}

export async function executeAiFlow(input: ExecuteAiInput) {
  clearAgentExecutionLogs();

  const sanitized = limitContext(sanitizePrompt(input.mensagem));
  const flagged = detectPromptInjection(input.mensagem);
  const userId = input.userId || 'anonymous';
  const tokenBudget = estimateTokens(sanitized);
  const quota = registerAiUsage({
    userId,
    tokens: tokenBudget,
    limitTokens: config.security.maxAiTokensPerHour,
    limitRequests: config.security.maxAiRequestsPerHour
  });

  if (quota.blocked) {
    throw new Error('Limite de uso de IA excedido.');
  }

  if (flagged) {
    addSecurityLog('ai', 'Tentativa de prompt injection detectada.', { userId, mensagem: sanitized });
  }

  addAuditLog({
    origem: 'ai',
    mensagem: 'Fluxo Deep Claw iniciado.',
    detalhes: { userId, mensagem: sanitized.slice(0, 240) }
  });

  const plano = createDeepClawPlan(sanitized);
  const respostas: Array<Awaited<ReturnType<typeof executeRoutedPrompt>>> = [];

  for (const tarefa of plano.tarefas) {
    const resposta = await executeRoutedPrompt({
      input: `${sanitized}\n\nTarefa: ${tarefa.objetivo}`,
      taskType: tarefa.tipo,
      language: 'pt-BR'
    });
    respostas.push(resposta);
  }

  const respostaFinal = formatFinalAnswerPortuguese([
    `Intenção classificada: ${plano.intencao}`,
    '',
    'Tarefas planejadas:',
    ...plano.tarefas.map((tarefa) => `- ${tarefa.titulo}: ${tarefa.objetivo}`),
    '',
    'Agentes acionados:',
    ...respostas.map((resposta) => `- ${resposta.agentName} (${resposta.model}) para ${resposta.taskType}`),
    '',
    'Status: fluxo simulado concluído com sucesso.'
  ].join('\n'));

  addAuditLog({
    origem: 'ai',
    mensagem: 'Fluxo Deep Claw concluído.',
    detalhes: {
      userId,
      agentes: respostas.map((resposta) => resposta.agentName),
      tokens: getTokenUsageLogs()
    }
  });

  recordAiRequest();
  logAiUsage({ userId, action: 'execute', model: respostas[0]?.model, tokens: tokenBudget });

  return {
    plano,
    respostas,
    respostaFinal,
    logs: getAgentExecutionLogs(),
    usoTokens: getTokenUsageLogs()
  };
}

export function listAgents() {
  return configuredAgents.map((agent) => ({
    nome: agent.nome,
    funcao: agent.funcao,
    modelo: agent.modelo,
    provedor: agent.provedor,
    custoEstimadoUsdPor1kTokens: agent.custoEstimadoUsdPor1kTokens,
    limiteTokens: agent.limiteTokens,
    tipoTarefaIdeal: agent.tipoTarefaIdeal,
    ativo: true
  }));
}
