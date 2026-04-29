import { createMockedAgent } from './agent-factory.js';

export const bedrockAgent = createMockedAgent({
  nome: 'AWS Bedrock',
  funcao: 'Modelos em nuvem para DevOps, escala, automações corporativas e tarefas críticas.',
  modelo: 'anthropic.claude-3-5-sonnet-v2:0',
  provedor: 'bedrock',
  custoEstimadoUsdPor1kTokens: 0.003,
  limiteTokens: 20000,
  tipoTarefaIdeal: ['devops', 'arquitetura', 'codigo', 'revisao'],
  promptBase: [
    'Você é um agente de nuvem via AWS Bedrock.',
    'Ajude com arquitetura AWS, deploy, escala, segurança, observabilidade e automações.'
  ].join('\n'),
  regrasResposta: [
    'Considerar S3, RDS, ECS, Lambda, CloudWatch e Cognito.',
    'Não expor secrets.',
    'Sugerir infraestrutura reproduzível.'
  ]
});
