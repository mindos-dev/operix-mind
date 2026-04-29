import {
  clearAgentExecutionLogs,
  createDeepClawPlan,
  executeRoutedPrompt,
  formatFinalAnswerPortuguese,
  getAgentExecutionLogs,
  getTokenUsageLogs
} from '../packages/ai-agents/src/index.js';

const entrada = 'crie um sistema de orçamento';

async function main() {
  clearAgentExecutionLogs();

  console.log('=== SIMULAÇÃO OPERIX MIND / DEEP CLAW ===');
  console.log(`Entrada do usuário: ${entrada}`);
  console.log('');

  const plano = createDeepClawPlan(entrada);

  console.log('--- Prompt melhorado por Gemma ---');
  console.log(plano.promptMelhorado);
  console.log('');

  console.log('--- Prompt traduzido/preparado para modelos em inglês ---');
  console.log(plano.promptEmIngles);
  console.log('');

  console.log('--- Plano do Deep Claw ---');
  console.log(`Intenção classificada: ${plano.intencao}`);
  for (const tarefa of plano.tarefas) {
    console.log(`- [${tarefa.prioridade}] ${tarefa.titulo} -> ${tarefa.agenteSugerido}`);
    console.log(`  Objetivo: ${tarefa.objetivo}`);
  }
  console.log('');

  console.log('--- Execução simulada das tarefas ---');
  const respostas = [];
  for (const tarefa of plano.tarefas) {
    const resposta = await executeRoutedPrompt({
      input: `${entrada}\n\nTarefa: ${tarefa.objetivo}`,
      taskType: tarefa.tipo,
      language: 'pt-BR'
    });
    respostas.push(resposta);
    console.log(`Agente: ${resposta.agentName}`);
    console.log(`Modelo: ${resposta.model}`);
    console.log(`Tokens estimados: ${resposta.estimatedTokens}`);
    console.log(`Custo estimado USD: ${resposta.estimatedCostUsd}`);
    console.log('');
  }

  const consolidado = formatFinalAnswerPortuguese([
    'Deep Claw concluiu a simulação do fluxo.',
    '',
    'Resultado:',
    '- Prompt simples foi melhorado.',
    '- Prompt foi preparado para inglês quando necessário.',
    '- Intenção foi classificada.',
    '- Tarefas foram divididas por especialidade.',
    '- Agentes foram roteados por tipo de tarefa.',
    '- Tokens e custos foram registrados.',
    '',
    'Próximo passo técnico: conectar esse fluxo ao backend base da Fase 4.'
  ].join('\n'));

  console.log('--- Resposta final consolidada ---');
  console.log(consolidado);
  console.log('');

  console.log('--- Logs internos detalhados ---');
  for (const log of getAgentExecutionLogs()) {
    console.log(`[${log.criadoEm}] ${log.etapa} | ${log.agente || 'sistema'} | ${log.decisao || 'evento'}`);
    console.log(`  ${log.detalhe}`);
    if (log.tokensEstimados !== undefined) console.log(`  Tokens estimados: ${log.tokensEstimados}`);
    if (log.custoEstimadoUsd !== undefined) console.log(`  Custo estimado USD: ${log.custoEstimadoUsd}`);
  }
  console.log('');

  console.log('--- Uso de tokens por chamada ---');
  for (const uso of getTokenUsageLogs()) {
    console.log(`${uso.agentName} / ${uso.model} / ${uso.taskType}: ${uso.tokens} tokens, USD ${uso.estimatedCostUsd}`);
  }
}

main().catch((error) => {
  console.error('Erro na simulação do Deep Claw:', error);
  process.exitCode = 1;
});
