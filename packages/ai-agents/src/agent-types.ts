export type ProvedorIA = 'deepseek' | 'ollama' | 'gemma' | 'bedrock' | 'interno';

export type TipoTarefa =
  | 'coordenacao'
  | 'arquitetura'
  | 'debug'
  | 'documentacao'
  | 'traducao'
  | 'resumo'
  | 'codigo'
  | 'devops'
  | 'conversao'
  | 'local'
  | 'revisao';

export interface AgentRequest {
  userId?: string;
  projectId?: string;
  input: string;
  taskType: TipoTarefa;
  language?: 'pt-BR' | 'en';
  files?: Array<{
    nome: string;
    conteudo?: string;
    resumo?: string;
  }>;
  metadata?: Record<string, unknown>;
}

export interface AgentResponse {
  agentName: string;
  model: string;
  taskType: TipoTarefa;
  output: string;
  estimatedTokens: number;
  estimatedCostUsd: number;
  warnings: string[];
  logs?: AgentExecutionLog[];
}

export interface AgentDefinition {
  nome: string;
  funcao: string;
  modelo: string;
  provedor: ProvedorIA;
  custoEstimadoUsdPor1kTokens: number;
  limiteTokens: number;
  tipoTarefaIdeal: TipoTarefa[];
  promptBase: string;
  regrasResposta: string[];
  execute(request: AgentRequest): Promise<AgentResponse>;
  review(content: string): Promise<AgentResponse>;
  summarize(content: string): Promise<AgentResponse>;
}

export interface AgentCallLog {
  agentName: string;
  model: string;
  taskType: TipoTarefa;
  tokens: number;
  estimatedCostUsd: number;
  createdAt: string;
}

export interface AgentExecutionLog {
  etapa: string;
  agente?: string;
  decisao?: string;
  tokensEstimados?: number;
  custoEstimadoUsd?: number;
  detalhe: string;
  criadoEm: string;
}

export interface AgentTask {
  id: string;
  titulo: string;
  tipo: TipoTarefa;
  objetivo: string;
  agenteSugerido?: string;
  prioridade: 'alta' | 'media' | 'baixa';
}

export interface DeepClawPlan {
  intencao: string;
  promptMelhorado: string;
  promptEmIngles: string;
  contextoTecnico: string;
  tarefas: AgentTask[];
  riscos: string[];
  logs: AgentExecutionLog[];
}
