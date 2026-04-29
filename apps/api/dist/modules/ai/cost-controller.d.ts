import type { AuthUser } from '../auth/auth.service.js';
export interface CostEstimate {
    modelo: string;
    tipoChamada: 'economica' | 'padrao' | 'premium';
    tokensEntrada: number;
    tokensSaida: number;
    custoEstimadoUsd: number;
    limitePlanoUsd: number;
    permitido: boolean;
    aviso?: string;
}
export declare function estimatePremiumCost(input: {
    user: AuthUser;
    modelo: string;
    tokensEntrada: number;
    tokensSaida: number;
    custoPor1kTokens: number;
    premium: boolean;
}): CostEstimate;
