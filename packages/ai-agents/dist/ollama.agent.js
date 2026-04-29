import { createMockedAgent } from './agent-factory.js';
export const ollamaAgent = createMockedAgent({
    nome: 'Ollama Local',
    funcao: 'Execução local de modelos, tarefas simples, apoio offline e redução de custo.',
    modelo: 'llama3.1:8b',
    provedor: 'ollama',
    custoEstimadoUsdPor1kTokens: 0,
    limiteTokens: 8192,
    tipoTarefaIdeal: ['local', 'resumo', 'documentacao', 'traducao'],
    promptBase: [
        'Você é um agente local da Mind_IA.',
        'Resolva tarefas simples sem custo de nuvem e preserve privacidade do cliente.'
    ].join('\n'),
    regrasResposta: [
        'Preferir respostas curtas.',
        'Não solicitar dados sensíveis.',
        'Indicar quando precisa de modelo mais forte.'
    ]
});
