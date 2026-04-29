import type { DeviceProfile, RuntimeDecision, RuntimeTask, UserPlan } from './runtime.types.js';
export declare function decideRuntime(task: RuntimeTask, device: DeviceProfile, userPlan: UserPlan): RuntimeDecision;
