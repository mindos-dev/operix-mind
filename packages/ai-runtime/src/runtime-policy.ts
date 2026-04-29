import type { RuntimeChoice, UserPlan } from './runtime.types.js';

export function isBedrockAllowed(plan: UserPlan): boolean {
  return plan === 'EMPRESA';
}

export function fallbackFor(runtime: RuntimeChoice): RuntimeChoice {
  if (runtime === 'local') return 'api_barata';
  if (runtime === 'api_barata') return 'cloud_forte';
  if (runtime === 'cloud_forte') return 'api_barata';
  return 'cloud_forte';
}
