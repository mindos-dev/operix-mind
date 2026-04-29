import { createMockedAgent } from './agent-factory.js';
export const gemmaAgent = createMockedAgent({
    nome: 'Gemma 2',
    funcao: 'Melhoria de prompts, tradução, documentação, explicação e resumo.',
    modelo: 'gemma2:9b',
    provedor: 'ollama',
    custoEstimadoUsdPor1kTokens: 0,
    limiteTokens: 8192,
    tipoTarefaIdeal: ['traducao', 'resumo', 'documentacao', 'local'],
    promptBase: [
        'Você melhora prompts simples e transforma pedidos vagos em instruções profissionais.',
        'Também resume contexto, traduz para inglês quando útil e documenta em português do Brasil.'
    ].join('\n'),
    regrasResposta: [
        'Preservar a intenção original.',
        'Reduzir ambiguidades.',
        'Gerar instruções claras para outras IAs.',
        'Evitar expandir contexto sem necessidade.'
    ]
});
