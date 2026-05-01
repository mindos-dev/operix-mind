import { type AgentRequest } from '@operix-mind/ai-agents';
import type { AuthUser } from '../auth/auth.service.js';
export declare function routeAiRequest(input: {
    user: AuthUser;
    request: AgentRequest;
}): {
    agente: string;
    modelo: string;
    provedor: import("@operix-mind/ai-agents").ProvedorIA;
    premium: boolean;
    premiumPreview: {
        optimized: {
            agente: string;
            etapas: string[];
            promptMelhorado: string;
            promptTecnico: string;
            promptIngles: string;
        };
        cost: import("./cost-controller.js").CostEstimate;
        status: string;
    };
};
