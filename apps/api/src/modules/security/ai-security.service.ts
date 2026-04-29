import { addLog } from '../logs/logs.service.js';

const aiRequestWindow = new Map<string, { count: number; tokens: number; resetAt: number }>();

export function sanitizePrompt(input: string): string {
  return input
    .replace(/\u0000/g, '')
    .replace(/<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/```[\s\S]*?```/g, (match) => match.slice(0, 4000))
    .replace(/\b(system prompt|ignore previous instructions|you are chatgpt|developer message)\b/gi, '[redacted]')
    .trim();
}

export function detectPromptInjection(input: string): boolean {
  return /ignore previous instructions|reveal system prompt|prompt injection|bypass|developer message/i.test(input);
}

export function limitContext(input: string, maxChars = 6000): string {
  if (input.length <= maxChars) return input;
  return `${input.slice(0, maxChars)}\n\n[Contexto reduzido por política de segurança.]`;
}

export function registerAiUsage(input: { userId: string; tokens: number; limitTokens: number; limitRequests: number }) {
  const now = Date.now();
  const bucket = aiRequestWindow.get(input.userId) || { count: 0, tokens: 0, resetAt: now + 60 * 60 * 1000 };

  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.tokens = 0;
    bucket.resetAt = now + 60 * 60 * 1000;
  }

  bucket.count += 1;
  bucket.tokens += input.tokens;
  aiRequestWindow.set(input.userId, bucket);

  const blocked = bucket.count > input.limitRequests || bucket.tokens > input.limitTokens;
  if (blocked) {
    addLog({
      level: 'alerta',
      origem: 'security',
      mensagem: 'Bloqueio automático por abuso de IA.',
      detalhes: { userId: input.userId, count: bucket.count, tokens: bucket.tokens }
    });
  }

  return { blocked, count: bucket.count, tokens: bucket.tokens, resetAt: new Date(bucket.resetAt).toISOString() };
}

export function logAiUsage(input: { userId: string; action: string; model?: string; tokens?: number }) {
  addLog({
    level: 'info',
    origem: 'security',
    mensagem: 'Uso de IA registrado.',
    detalhes: {
      userId: input.userId,
      action: input.action,
      model: input.model,
      tokens: input.tokens
    }
  });
}
