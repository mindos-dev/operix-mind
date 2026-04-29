import type { AgentRequest } from './agent-types.js';
export declare function improveUserPrompt(input: string): string;
export declare function translatePromptToEnglish(prompt: string): string;
export declare function addTechnicalContext(prompt: string): string;
export declare function createTaskContext(request: AgentRequest): string;
export declare function formatFinalAnswerPortuguese(content: string): string;
