import { addTechnicalContext, improveUserPrompt, translatePromptToEnglish } from '@operix-mind/ai-agents';
export function optimizePromptWithGemma(input) {
    const promptMelhorado = improveUserPrompt(input);
    const promptTecnico = addTechnicalContext(promptMelhorado);
    const promptIngles = translatePromptToEnglish(promptTecnico);
    return {
        agente: 'Gemma 2',
        etapas: [
            'limpeza do prompt',
            'remoção de repetição',
            'contexto técnico',
            'tradução preparada para modelo forte'
        ],
        promptMelhorado,
        promptTecnico,
        promptIngles
    };
}
