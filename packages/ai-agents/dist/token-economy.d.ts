import type { AgentCallLog, AgentDefinition, AgentExecutionLog, TipoTarefa } from './agent-types.js';
export declare function logAgentDecision(log: Omit<AgentExecutionLog, 'criadoEm'>): AgentExecutionLog;
export declare function estimateTokens(text: string): number;
export declare function trimPrompt(prompt: string, maxTokens: number): string;
export declare function summarizeContext(content: string, maxChars?: number): string;
export declare function buildCompactContext(files: Array<{
    nome: string;
    conteudo?: string;
    resumo?: string;
}>): string;
export declare function selectCheapestCapableModel(agents: AgentDefinition[], taskType: TipoTarefa): AgentDefinition;
export declare function logTokenUsage(log: AgentCallLog): void;
export declare function getTokenUsageLogs(): AgentCallLog[];
export declare function getAgentExecutionLogs(): AgentExecutionLog[];
export declare function clearAgentExecutionLogs(): void;
export declare function estimateCost(tokens: number, costPer1kTokens: number): number;
