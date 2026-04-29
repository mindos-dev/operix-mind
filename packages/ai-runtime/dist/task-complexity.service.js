export function classifyTaskComplexity(task) {
    const input = `${task.tipo} ${task.prompt}`.toLowerCase();
    if (task.requerAltaPrecisao ||
        task.debugDificil ||
        input.includes('revisão final') ||
        input.includes('alta precisão') ||
        input.includes('bedrock'))
        return 'critica';
    if (task.documentoGrande ||
        task.tokensEstimados > 6000 ||
        input.includes('arquitetura') ||
        input.includes('relatório técnico') ||
        input.includes('dashboard') ||
        input.includes('cad') ||
        input.includes('dwg') ||
        input.includes('debug') ||
        input.includes('código') ||
        input.includes('codigo'))
        return 'complexa';
    if (task.tokensEstimados > 1600 ||
        input.includes('proposta') ||
        input.includes('orçamento') ||
        input.includes('orcamento') ||
        input.includes('relatório') ||
        input.includes('relatorio') ||
        input.includes('planilha'))
        return 'media';
    return 'simples';
}
