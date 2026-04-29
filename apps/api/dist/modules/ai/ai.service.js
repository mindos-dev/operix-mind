import { clearAgentExecutionLogs, configuredAgents, createDeepClawPlan, executeRoutedPrompt, formatFinalAnswerPortuguese, getAgentExecutionLogs, getTokenUsageLogs } from '@operix-mind/ai-agents';
import { addLog } from '../logs/logs.service.js';
export async function executeAiFlow(input) {
    clearAgentExecutionLogs();
    addLog({
        level: 'info',
        origem: 'ai',
        mensagem: 'Fluxo Deep Claw iniciado.',
        detalhes: { mensagem: input.mensagem }
    });
    const plano = createDeepClawPlan(input.mensagem);
    const respostas = [];
    for (const tarefa of plano.tarefas) {
        const resposta = await executeRoutedPrompt({
            input: `${input.mensagem}\n\nTarefa: ${tarefa.objetivo}`,
            taskType: tarefa.tipo,
            language: 'pt-BR'
        });
        respostas.push(resposta);
    }
    const respostaFinal = formatFinalAnswerPortuguese([
        `Intenção classificada: ${plano.intencao}`,
        '',
        'Tarefas planejadas:',
        ...plano.tarefas.map((tarefa) => `- ${tarefa.titulo}: ${tarefa.objetivo}`),
        '',
        'Agentes acionados:',
        ...respostas.map((resposta) => `- ${resposta.agentName} (${resposta.model}) para ${resposta.taskType}`),
        '',
        'Status: fluxo simulado concluído com sucesso.'
    ].join('\n'));
    addLog({
        level: 'sucesso',
        origem: 'ai',
        mensagem: 'Fluxo Deep Claw concluído.',
        detalhes: {
            agentes: respostas.map((resposta) => resposta.agentName),
            tokens: getTokenUsageLogs()
        }
    });
    return {
        plano,
        respostas,
        respostaFinal,
        logs: getAgentExecutionLogs(),
        usoTokens: getTokenUsageLogs()
    };
}
export function listAgents() {
    return configuredAgents.map((agent) => ({
        nome: agent.nome,
        funcao: agent.funcao,
        modelo: agent.modelo,
        provedor: agent.provedor,
        custoEstimadoUsdPor1kTokens: agent.custoEstimadoUsdPor1kTokens,
        limiteTokens: agent.limiteTokens,
        tipoTarefaIdeal: agent.tipoTarefaIdeal,
        ativo: true
    }));
}
