import type { RuntimeChoice, UserPlan } from './runtime.types.js';
export declare function estimateRuntimeCost(runtime: RuntimeChoice, tokens: number): number;
export declare function checkUserLimit(plan: UserPlan, runtime: RuntimeChoice, cost: number): boolean;
export declare function getPlanLimit(plan: UserPlan): number;
export declare function estimateTokens(text: string): number;
export declare function estimateCost(tokens: number, costPer1kTokens: number): number;
