import type { AgentCallLog, AgentDefinition, AgentExecutionLog, TipoTarefa } from './agent-types.js';

const tokenLogs: AgentCallLog[] = [];
const executionLogs: AgentExecutionLog[] = [];

function now(): string {
  return new Date().toISOString();
}

export function logAgentDecision(log: Omit<AgentExecutionLog, 'criadoEm'>): AgentExecutionLog {
  const entry = {
    ...log,
    criadoEm: now()
  };
  executionLogs.push(entry);
  return entry;
}

export function estimateTokens(text: string): number {
  if (!text.trim()) return 0;
  return Math.ceil(text.trim().length / 4);
}

export function trimPrompt(prompt: string, maxTokens: number): string {
  const estimated = estimateTokens(prompt);
  if (estimated <= maxTokens) return prompt;

  const maxChars = Math.max(400, maxTokens * 4);
  logAgentDecision({
    etapa: 'economia_de_tokens',
    decisao: 'prompt_reduzido',
    tokensEstimados: estimated,
    detalhe: `Prompt reduzido para respeitar o limite de ${maxTokens} tokens.`
  });
  return `${prompt.slice(0, maxChars)}\n\n[Contexto reduzido automaticamente para economizar tokens.]`;
}

export function summarizeContext(content: string, maxChars = 1400): string {
  if (content.length <= maxChars) return content;

  const start = content.slice(0, Math.floor(maxChars * 0.65));
  const end = content.slice(-Math.floor(maxChars * 0.25));
  return `${start}\n\n[Resumo automático: conteúdo intermediário omitido por economia de tokens.]\n\n${end}`;
}

export function buildCompactContext(files: Array<{ nome: string; conteudo?: string; resumo?: string }>): string {
  if (files.length === 0) return 'Nenhum arquivo anexado.';

  return files
    .map((file) => {
      const content = file.resumo || summarizeContext(file.conteudo || '');
      return `Arquivo: ${file.nome}\n${content}`;
    })
    .join('\n\n---\n\n');
}

export function selectCheapestCapableModel(
  agents: AgentDefinition[],
  taskType: TipoTarefa
): AgentDefinition {
  const capable = agents.filter((agent) => agent.tipoTarefaIdeal.includes(taskType));
  const candidates = capable.length > 0 ? capable : agents;

  const selected = [...candidates].sort(
    (a, b) => a.custoEstimadoUsdPor1kTokens - b.custoEstimadoUsdPor1kTokens
  )[0];

  logAgentDecision({
    etapa: 'roteamento',
    agente: selected.nome,
    decisao: 'modelo_mais_barato_capaz',
    detalhe: `Agente escolhido para tarefa ${taskType}: ${selected.nome}.`
  });

  return selected;
}

export function logTokenUsage(log: AgentCallLog): void {
  tokenLogs.push(log);
  logAgentDecision({
    etapa: 'uso_de_tokens',
    agente: log.agentName,
    tokensEstimados: log.tokens,
    custoEstimadoUsd: log.estimatedCostUsd,
    detalhe: `Uso registrado para ${log.agentName} com modelo ${log.model}.`
  });
}

export function getTokenUsageLogs(): AgentCallLog[] {
  return [...tokenLogs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getAgentExecutionLogs(): AgentExecutionLog[] {
  return [...executionLogs].sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));
}

export function clearAgentExecutionLogs(): void {
  executionLogs.length = 0;
  tokenLogs.length = 0;
}

export function estimateCost(tokens: number, costPer1kTokens: number): number {
  return Number(((tokens / 1000) * costPer1kTokens).toFixed(6));
}
