import { addTechnicalContext, improveUserPrompt, translatePromptToEnglish } from '@operix-mind/ai-agents';
import { sanitizePrompt } from '../security/ai-security.service.js';

export function optimizePromptWithGemma(input: string) {
  const cleaned = sanitizePrompt(input);
  const promptMelhorado = improveUserPrompt(cleaned);
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
