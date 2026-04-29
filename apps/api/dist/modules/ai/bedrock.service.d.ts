import type { AuthUser } from '../auth/auth.service.js';
export declare function prepareBedrockCall(input: {
    user: AuthUser;
    prompt: string;
}): {
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
