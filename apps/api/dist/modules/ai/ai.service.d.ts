export interface ExecuteAiInput {
    mensagem: string;
    userId?: string;
}
export declare function executeAiFlow(input: ExecuteAiInput): Promise<{
    plano: import("@operix-mind/ai-agents").DeepClawPlan;
    respostas: import("@operix-mind/ai-agents").AgentResponse[];
    respostaFinal: string;
    logs: import("@operix-mind/ai-agents").AgentExecutionLog[];
    usoTokens: import("@operix-mind/ai-agents").AgentCallLog[];
}>;
export declare function listAgents(): {
    nome: string;
    funcao: string;
    modelo: string;
    provedor: import("@operix-mind/ai-agents").ProvedorIA;
    custoEstimadoUsdPor1kTokens: number;
    limiteTokens: number;
    tipoTarefaIdeal: import("@operix-mind/ai-agents").TipoTarefa[];
    ativo: boolean;
}[];
