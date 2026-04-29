import type { RuntimeChoice, UserPlan } from './runtime.types.js';
export declare function isBedrockAllowed(plan: UserPlan): boolean;
export declare function fallbackFor(runtime: RuntimeChoice): RuntimeChoice;
