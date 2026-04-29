import { createMockedAgent } from './agent-factory.js';
import type { AgentTask, DeepClawPlan } from './agent-types.js';
import {
  addTechnicalContext,
  improveUserPrompt,
  translatePromptToEnglish
} from './context-builder.js';
import {
  estimateCost,
  estimateTokens,
  getAgentExecutionLogs,
  logAgentDecision,
  trimPrompt
} from './token-economy.js';

export const deepClawAgent = createMockedAgent({
  nome: 'Deep Claw',
  funcao: 'Coordenador técnico, arquiteto, revisor e orquestrador de agentes.',
  modelo: 'operix-deep-claw-orchestrator-v0',
  provedor: 'interno',
  custoEstimadoUsdPor1kTokens: 0.0002,
  limiteTokens: 12000,
  tipoTarefaIdeal: ['coordenacao', 'arquitetura', 'revisao'],
  promptBase: [
    'Você é o Deep Claw, agente principal da Mind_IA.',
    'Atue como gerente técnico, arquiteto, revisor e orquestrador.',
    'Divida tarefas, escolha agentes, reduza custo e entregue resultado final limpo.',
    'Todas as respostas visíveis ao usuário devem ser em português do Brasil.'
  ].join('\n'),
  regrasResposta: [
    'Criar plano antes de executar.',
    'Evitar repetir contexto desnecessário.',
    'Encaminhar tarefas simples para modelos baratos ou locais.',
    'Validar riscos de segurança e custo.',
    'Consolidar a resposta final em português do Brasil.'
  ]
});

export function createDeepClawPlan(input: string): DeepClawPlan {
  logAgentDecision({
    etapa: 'deep_claw',
    agente: 'Deep Claw',
    decisao: 'receber_intencao',
    detalhe: `Intenção recebida: ${input}`
  });

  const promptMelhorado = improveUserPrompt(input);
  const promptEmIngles = translatePromptToEnglish(promptMelhorado);
  const contextoTecnico = trimPrompt(addTechnicalContext(promptMelhorado), deepClawAgent.limiteTokens);
  const intencao = classifyIntent(input);
  const tarefas = splitIntoTasks(input);
  const riscos = [
    'Escopo pode crescer se o usuário pedir geração completa de código sem limites.',
    'Chamadas para modelos em nuvem devem ser aprovadas por plano e orçamento.',
    'Execução de terminal deve passar por política de comandos permitidos.'
  ];

  const tokens = estimateTokens(`${promptMelhorado}\n${promptEmIngles}\n${contextoTecnico}`);
  const custo = estimateCost(tokens, deepClawAgent.custoEstimadoUsdPor1kTokens);

  logAgentDecision({
    etapa: 'deep_claw',
    agente: 'Deep Claw',
    decisao: 'plano_criado',
    tokensEstimados: tokens,
    custoEstimadoUsd: custo,
    detalhe: `Plano criado com ${tarefas.length} tarefas para intenção ${intencao}.`
  });

  return {
    intencao,
    promptMelhorado,
    promptEmIngles,
    contextoTecnico,
    tarefas,
    riscos,
    logs: getAgentExecutionLogs()
  };
}

function classifyIntent(input: string): string {
  const normalized = input.toLowerCase();
  if (normalized.includes('erro') || normalized.includes('bug')) return 'debug';
  if (normalized.includes('relatório') || normalized.includes('relatorio')) return 'documento_tecnico';
  if (normalized.includes('dashboard')) return 'dashboard';
  if (normalized.includes('orçamento') || normalized.includes('orcamento')) return 'sistema_de_orcamento';
  if (normalized.includes('aws') || normalized.includes('deploy')) return 'devops';
  return 'sistema_geral';
}

function splitIntoTasks(input: string): AgentTask[] {
  const isBudgetSystem = input.toLowerCase().includes('orçamento') || input.toLowerCase().includes('orcamento');

  const baseTasks: AgentTask[] = [
    {
      id: 'planejamento-arquitetura',
      titulo: 'Definir arquitetura da solução',
      tipo: 'arquitetura',
      objetivo: 'Escolher módulos, fronteiras, banco de dados, autenticação e integrações.',
      agenteSugerido: 'DeepSeek',
      prioridade: 'alta'
    },
    {
      id: 'modelagem-backend',
      titulo: 'Planejar backend e banco',
      tipo: 'codigo',
      objetivo: 'Definir entidades, serviços, rotas, validações e logs.',
      agenteSugerido: 'DeepSeek',
      prioridade: 'alta'
    },
    {
      id: 'interface-frontend',
      titulo: 'Planejar frontend',
      tipo: 'codigo',
      objetivo: 'Definir telas, componentes, estado da aplicação e fluxo do usuário.',
      agenteSugerido: 'Ollama Local',
      prioridade: 'media'
    },
    {
      id: 'documentacao',
      titulo: 'Gerar documentação inicial',
      tipo: 'documentacao',
      objetivo: 'Criar resumo técnico, instruções de uso e próximos passos.',
      agenteSugerido: 'Gemma 2',
      prioridade: 'media'
    },
    {
      id: 'devops',
      titulo: 'Preparar execução e deploy',
      tipo: 'devops',
      objetivo: 'Planejar Docker, variáveis de ambiente e preparação para AWS.',
      agenteSugerido: 'AWS Bedrock',
      prioridade: isBudgetSystem ? 'media' : 'baixa'
    }
  ];

  logAgentDecision({
    etapa: 'deep_claw',
    agente: 'Deep Claw',
    decisao: 'tarefas_divididas',
    detalhe: `Deep Claw dividiu o pedido em ${baseTasks.length} tarefas.`
  });

  return baseTasks;
}
