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

const planLimits: Record<AuthUser['plano'], number> = {
  GRATIS: 0,
  PRO: 1,
  ENGENHARIA: 3,
  DEV: 2,
  EMPRESA: 20
};

export function estimatePremiumCost(input: {
  user: AuthUser;
  modelo: string;
  tokensEntrada: number;
  tokensSaida: number;
  custoPor1kTokens: number;
  premium: boolean;
}): CostEstimate {
  const totalTokens = input.tokensEntrada + input.tokensSaida;
  const custoEstimadoUsd = Number(((totalTokens / 1000) * input.custoPor1kTokens).toFixed(6));
  const limitePlanoUsd = planLimits[input.user.plano];
  const tipoChamada = input.premium ? 'premium' : custoEstimadoUsd === 0 ? 'economica' : 'padrao';
  const permitido = !input.premium || limitePlanoUsd > 0;

  return {
    modelo: input.modelo,
    tipoChamada,
    tokensEntrada: input.tokensEntrada,
    tokensSaida: input.tokensSaida,
    custoEstimadoUsd,
    limitePlanoUsd,
    permitido,
    aviso: input.premium ? 'Esta ação usa IA premium.' : undefined
  };
}
