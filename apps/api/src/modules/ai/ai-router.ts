import { routePrompt, type AgentRequest } from '@operix-mind/ai-agents';
import type { AuthUser } from '../auth/auth.service.js';
import { prepareBedrockCall } from './bedrock.service.js';

export function routeAiRequest(input: { user: AuthUser; request: AgentRequest }) {
  const agent = routePrompt(input.request);
  const premiumPreview = agent.provedor === 'bedrock'
    ? prepareBedrockCall({ user: input.user, prompt: input.request.input })
    : undefined;

  return {
    agente: agent.nome,
    modelo: agent.modelo,
    provedor: agent.provedor,
    premium: agent.provedor === 'bedrock',
    premiumPreview
  };
}
