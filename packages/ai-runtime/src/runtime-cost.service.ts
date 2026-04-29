import type { RuntimeChoice, UserPlan } from './runtime.types.js';

const runtimeCost: Record<RuntimeChoice, number> = {
  local: 0,
  api_barata: 0.0006,
  cloud_forte: 0.0014,
  bedrock_premium: 0.003
};

const planLimits: Record<UserPlan, number> = {
  GRATIS: 0,
  PRO: 1,
  ENGENHARIA: 3,
  DEV: 2,
  EMPRESA: 20
};

export function estimateRuntimeCost(runtime: RuntimeChoice, tokens: number): number {
  return Number(((tokens / 1000) * runtimeCost[runtime]).toFixed(6));
}

export function checkUserLimit(plan: UserPlan, runtime: RuntimeChoice, cost: number): boolean {
  if (runtime === 'bedrock_premium' && plan !== 'EMPRESA') return false;
  if (plan === 'GRATIS' && runtime !== 'local' && cost > 0) return false;
  return cost <= planLimits[plan] || runtime !== 'bedrock_premium';
}

export function getPlanLimit(plan: UserPlan): number {
  return planLimits[plan];
}

export function estimateTokens(text: string): number {
  if (!text.trim()) return 0;
  return Math.ceil(text.trim().length / 4);
}

export function estimateCost(tokens: number, costPer1kTokens: number): number {
  return Number(((tokens / 1000) * costPer1kTokens).toFixed(6));
}
