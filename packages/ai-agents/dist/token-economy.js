const tokenLogs = [];
const executionLogs = [];
function now() {
    return new Date().toISOString();
}
export function logAgentDecision(log) {
    const entry = {
        ...log,
        criadoEm: now()
    };
    executionLogs.push(entry);
    return entry;
}
export function estimateTokens(text) {
    if (!text.trim())
        return 0;
    return Math.ceil(text.trim().length / 4);
}
export function trimPrompt(prompt, maxTokens) {
    const estimated = estimateTokens(prompt);
    if (estimated <= maxTokens)
        return prompt;
    const maxChars = Math.max(400, maxTokens * 4);
    logAgentDecision({
        etapa: 'economia_de_tokens',
        decisao: 'prompt_reduzido',
        tokensEstimados: estimated,
        detalhe: `Prompt reduzido para respeitar o limite de ${maxTokens} tokens.`
    });
    return `${prompt.slice(0, maxChars)}\n\n[Contexto reduzido automaticamente para economizar tokens.]`;
}
export function summarizeContext(content, maxChars = 1400) {
    if (content.length <= maxChars)
        return content;
    const start = content.slice(0, Math.floor(maxChars * 0.65));
    const end = content.slice(-Math.floor(maxChars * 0.25));
    return `${start}\n\n[Resumo automático: conteúdo intermediário omitido por economia de tokens.]\n\n${end}`;
}
export function buildCompactContext(files) {
    if (files.length === 0)
        return 'Nenhum arquivo anexado.';
    return files
        .map((file) => {
        const content = file.resumo || summarizeContext(file.conteudo || '');
        return `Arquivo: ${file.nome}\n${content}`;
    })
        .join('\n\n---\n\n');
}
export function selectCheapestCapableModel(agents, taskType) {
    const capable = agents.filter((agent) => agent.tipoTarefaIdeal.includes(taskType));
    const candidates = capable.length > 0 ? capable : agents;
    const selected = [...candidates].sort((a, b) => a.custoEstimadoUsdPor1kTokens - b.custoEstimadoUsdPor1kTokens)[0];
    logAgentDecision({
        etapa: 'roteamento',
        agente: selected.nome,
        decisao: 'modelo_mais_barato_capaz',
        detalhe: `Agente escolhido para tarefa ${taskType}: ${selected.nome}.`
    });
    return selected;
}
export function logTokenUsage(log) {
    tokenLogs.push(log);
    logAgentDecision({
        etapa: 'uso_de_tokens',
        agente: log.agentName,
        tokensEstimados: log.tokens,
        custoEstimadoUsd: log.estimatedCostUsd,
        detalhe: `Uso registrado para ${log.agentName} com modelo ${log.model}.`
    });
}
export function getTokenUsageLogs() {
    return [...tokenLogs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function getAgentExecutionLogs() {
    return [...executionLogs].sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));
}
export function clearAgentExecutionLogs() {
    executionLogs.length = 0;
    tokenLogs.length = 0;
}
export function estimateCost(tokens, costPer1kTokens) {
    return Number(((tokens / 1000) * costPer1kTokens).toFixed(6));
}
