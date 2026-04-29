import type { AgentRequest } from './agent-types.js';
import { buildCompactContext, estimateTokens, logAgentDecision, trimPrompt } from './token-economy.js';

export function improveUserPrompt(input: string): string {
  const normalized = input.trim();
  const improved = [
    'Crie uma solução completa a partir do pedido do usuário.',
    'A resposta deve transformar a intenção simples em uma instrução técnica clara, objetiva e executável.',
    'Preserve a intenção original, detalhe entregáveis, critérios de aceite, módulos, riscos e restrições.',
    '',
    `Pedido do usuário: ${normalized}`,
    '',
    'Entregáveis esperados:',
    '- arquitetura modular',
    '- plano de execução',
    '- tarefas separadas por agente',
    '- validações necessárias',
    '- resposta final em português do Brasil'
  ].join('\n');

  logAgentDecision({
    etapa: 'prompt_builder',
    agente: 'Gemma',
    decisao: 'melhorar_prompt',
    tokensEstimados: estimateTokens(improved),
    detalhe: 'Prompt simples convertido em instrução técnica estruturada.'
  });

  return improved;
}

export function translatePromptToEnglish(prompt: string): string {
  const translated = [
    'Translate the following technical prompt to English while preserving business context.',
    'Return only the translated prompt.',
    '',
    prompt
  ].join('\n');

  logAgentDecision({
    etapa: 'prompt_builder',
    agente: 'Gemma',
    decisao: 'traduzir_prompt',
    tokensEstimados: estimateTokens(translated),
    detalhe: 'Prompt preparado para modelos que performam melhor em inglês.'
  });

  return translated;
}

export function addTechnicalContext(prompt: string): string {
  const contextualized = [
    prompt,
    '',
    'Contexto técnico padrão Mind_IA:',
    '- Responder em português do Brasil para o usuário final.',
    '- Priorizar arquitetura modular, segurança, logs e manutenção.',
    '- Evitar chamadas caras de IA quando um modelo local ou barato resolver.',
    '- Não executar comandos destrutivos sem confirmação explícita.',
    '- Separar frontend, backend, dados, integrações e automações.'
  ].join('\n');

  logAgentDecision({
    etapa: 'contexto',
    decisao: 'adicionar_contexto_tecnico',
    tokensEstimados: estimateTokens(contextualized),
    detalhe: 'Contexto técnico padrão Mind_IA anexado ao prompt.'
  });

  return contextualized;
}

export function createTaskContext(request: AgentRequest): string {
  const filesContext = buildCompactContext(request.files || []);

  return trimPrompt(
    [
      `Tipo de tarefa: ${request.taskType}`,
      `Idioma preferido: ${request.language || 'pt-BR'}`,
      '',
      'Solicitação:',
      request.input,
      '',
      'Arquivos relevantes:',
      filesContext
    ].join('\n'),
    6000
  );
}

export function formatFinalAnswerPortuguese(content: string): string {
  return [
    'Resposta final consolidada em português do Brasil:',
    '',
    content.trim()
  ].join('\n');
}
