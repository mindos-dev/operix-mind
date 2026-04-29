import type { AgentDefinition } from './agent-types.js';
export declare function createMockedAgent(config: Omit<AgentDefinition, 'execute' | 'review' | 'summarize'>): AgentDefinition;
