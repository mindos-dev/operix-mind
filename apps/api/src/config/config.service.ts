import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3333),
  PORT: z.coerce.number().int().positive().optional(),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  JWT_ACCESS_SECRET: z.string().min(16).optional(),
  JWT_REFRESH_SECRET: z.string().min(16).optional(),
  JWT_SECRET: z.string().min(16).optional(),
  AUTH_ACCESS_TTL: z.string().default('15m'),
  AUTH_REFRESH_TTL: z.string().default('30d'),
  MAX_JSON_BODY: z.coerce.number().int().positive().default(2 * 1024 * 1024),
  UPLOAD_MAX_BYTES: z.coerce.number().int().positive().default(25 * 1024 * 1024),
  MAX_REQUESTS_PER_MINUTE: z.coerce.number().int().positive().default(120),
  MAX_AI_REQUESTS_PER_HOUR: z.coerce.number().int().positive().default(60),
  MAX_AI_TOKENS_PER_HOUR: z.coerce.number().int().positive().default(30000)
});

const parsed = envSchema.parse(process.env);

export const config = {
  nodeEnv: parsed.NODE_ENV,
  port: parsed.PORT ?? parsed.API_PORT,
  corsOrigin: parsed.CORS_ORIGIN,
  jwt: {
    accessSecret: parsed.JWT_ACCESS_SECRET || parsed.JWT_SECRET || 'operix-mind-dev-access-secret',
    refreshSecret: parsed.JWT_REFRESH_SECRET || parsed.JWT_SECRET || 'operix-mind-dev-refresh-secret',
    accessTtl: parsed.AUTH_ACCESS_TTL,
    refreshTtl: parsed.AUTH_REFRESH_TTL
  },
  security: {
    maxJsonBody: parsed.MAX_JSON_BODY,
    uploadMaxBytes: parsed.UPLOAD_MAX_BYTES,
    maxRequestsPerMinute: parsed.MAX_REQUESTS_PER_MINUTE,
    maxAiRequestsPerHour: parsed.MAX_AI_REQUESTS_PER_HOUR,
    maxAiTokensPerHour: parsed.MAX_AI_TOKENS_PER_HOUR
  }
} as const;
