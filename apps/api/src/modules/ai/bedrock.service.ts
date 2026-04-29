import { estimateTokens } from '@operix-mind/ai-agents';
import type { AuthUser } from '../auth/auth.service.js';
import { addLog } from '../logs/logs.service.js';
import { estimatePremiumCost } from './cost-controller.js';
import { optimizePromptWithGemma } from './prompt-optimizer.js';

export function prepareBedrockCall(input: { user: AuthUser; prompt: string }) {
  const optimized = optimizePromptWithGemma(input.prompt);
  const tokensEntrada = estimateTokens(optimized.promptIngles);
  const tokensSaida = Math.ceil(tokensEntrada * 0.7);
  const cost = estimatePremiumCost({
    user: input.user,
    modelo: 'anthropic.claude-3-5-sonnet-v2:0',
    tokensEntrada,
    tokensSaida,
    custoPor1kTokens: 0.003,
    premium: true
  });

  addLog({
    level: cost.permitido ? 'info' : 'alerta',
    origem: 'bedrock',
    mensagem: cost.permitido ? 'Chamada Bedrock preparada em modo mock.' : 'Chamada Bedrock bloqueada pelo plano.',
    detalhes: cost
  });

  return {
    optimized,
    cost,
    status: cost.permitido ? 'preparado' : 'bloqueado'
  };
}
