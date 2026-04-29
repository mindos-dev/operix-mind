import type { AgentDefinition, AgentRequest } from './agent-types.js';
export declare const configuredAgents: AgentDefinition[];
export declare function routePrompt(request: AgentRequest): AgentDefinition;
export declare function executeRoutedPrompt(request: AgentRequest): Promise<import("./agent-types.js").AgentResponse>;
