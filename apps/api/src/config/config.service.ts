import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3333),
  PORT: z.coerce.number().int().positive().optional(),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  WEB_PUBLIC_URL: z.string().url().optional(),
  DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  JWT_ACCESS_SECRET: z.string().min(16).optional(),
  JWT_REFRESH_SECRET: z.string().min(16).optional(),
  JWT_SECRET: z.string().min(16).optional(),
  AUTH_ACCESS_TTL: z.string().default('15m'),
  AUTH_REFRESH_TTL: z.string().default('30d'),
  MAX_JSON_BODY: z.coerce.number().int().positive().default(2 * 1024 * 1024),
  UPLOAD_MAX_BYTES: z.coerce.number().int().positive().default(25 * 1024 * 1024),
  MAX_REQUESTS_PER_MINUTE: z.coerce.number().int().positive().default(120),
  MAX_AI_REQUESTS_PER_HOUR: z.coerce.number().int().positive().default(60),
  MAX_AI_TOKENS_PER_HOUR: z.coerce.number().int().positive().default(30000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  ENABLE_PRETTY_LOGS: z.coerce.boolean().default(false),
  APP_PUBLIC_URL: z.string().url().optional(),
  SECRET_ENCRYPTION_KEY: z.string().optional(),
  SETUP_TOKEN: z.string().optional(),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  LOCAL_STORAGE_DIR: z.string().default('storage'),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(25),
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_PROFILE: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_S3_PUBLIC_BASE_URL: z.string().optional(),
  AWS_SECRETS_MANAGER_PREFIX: z.string().optional(),
  AWS_KMS_KEY_ID: z.string().optional(),
  AWS_BEDROCK_MODEL_ID: z.string().optional(),
  AWS_TEXTRACT_REGION: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  AUDIT_LOG_RETENTION_DAYS: z.coerce.number().int().positive().default(90),
  TELEGRAM_MAX_FILE_MB: z.coerce.number().int().positive().default(25),
  TELEGRAM_STORAGE_DIR: z.string().default('storage/telegram'),
  TELEGRAM_PAIRING_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  TELEGRAM_MAX_MESSAGES_PER_MINUTE: z.coerce.number().int().positive().default(20),
  TELEGRAM_MAX_UPLOADS_PER_HOUR: z.coerce.number().int().positive().default(30),
  TELEGRAM_MAX_DEEPCLAW_TASKS_PER_DAY: z.coerce.number().int().positive().default(50),
  BI_ENABLED: z.coerce.boolean().default(true),
  BI_STORAGE_DIR: z.string().default('storage/bi'),
  BI_MAX_UPLOAD_MB: z.coerce.number().int().positive().default(50),
  BI_MAX_ROWS_PREVIEW: z.coerce.number().int().positive().default(100),
  BI_MAX_ROWS_IN_MEMORY: z.coerce.number().int().positive().default(50000),
  BI_ENABLE_AI_INSIGHTS: z.coerce.boolean().default(true),
  BI_ENABLE_INTERNAL_METRICS: z.coerce.boolean().default(true),
  POWERBI_TENANT_ID: z.string().optional(),
  POWERBI_CLIENT_ID: z.string().optional(),
  POWERBI_CLIENT_SECRET: z.string().optional(),
  POWERBI_WORKSPACE_ID: z.string().optional(),
  OAUTH_GOOGLE_CLIENT_ID: z.string().optional(),
  OAUTH_GOOGLE_CLIENT_SECRET: z.string().optional(),
  OAUTH_GITHUB_CLIENT_ID: z.string().optional(),
  OAUTH_GITHUB_CLIENT_SECRET: z.string().optional(),
  OAUTH_AZURE_CLIENT_ID: z.string().optional(),
  OAUTH_AZURE_CLIENT_SECRET: z.string().optional(),
  ADMIN_BOOTSTRAP_EMAIL: z.string().email().default('admin@mind.local'),
  ADMIN_BOOTSTRAP_PASSWORD: z.string().min(8).default('MindAdmin123!'),
  ADMIN_BOOTSTRAP_NAME: z.string().default('Admin Mind_IA')
});

const parsed = envSchema.parse(process.env);

if (parsed.NODE_ENV === 'production') {
  const required = [
    ['DATABASE_URL', parsed.DATABASE_URL],
    ['JWT_ACCESS_SECRET', parsed.JWT_ACCESS_SECRET || parsed.JWT_SECRET],
    ['JWT_REFRESH_SECRET', parsed.JWT_REFRESH_SECRET || parsed.JWT_SECRET],
    ['SECRET_ENCRYPTION_KEY', parsed.SECRET_ENCRYPTION_KEY]
  ] as const;

  const missing = required.filter(([, value]) => !value).map(([key]) => key);
  if (missing.length) {
    throw new Error(`Variáveis obrigatórias ausentes em produção: ${missing.join(', ')}.`);
  }
}

export const config = {
  nodeEnv: parsed.NODE_ENV,
  port: parsed.PORT ?? parsed.API_PORT,
  corsOrigin: parsed.CORS_ORIGIN,
  databaseUrl: parsed.DATABASE_URL || '',
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
  },
  logging: {
    level: parsed.LOG_LEVEL,
    pretty: parsed.ENABLE_PRETTY_LOGS
  },
  appPublicUrl: parsed.APP_PUBLIC_URL || '',
  webPublicUrl: parsed.WEB_PUBLIC_URL || '',
  secretEncryptionKey: parsed.SECRET_ENCRYPTION_KEY || '',
  setupToken: parsed.SETUP_TOKEN || '',
  storage: {
    driver: parsed.STORAGE_DRIVER,
    localDir: parsed.LOCAL_STORAGE_DIR,
    maxUploadMb: parsed.MAX_UPLOAD_MB
  },
  aws: {
    region: parsed.AWS_REGION || '',
    accessKeyId: parsed.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: parsed.AWS_SECRET_ACCESS_KEY || '',
    profile: parsed.AWS_PROFILE || '',
    s3Bucket: parsed.AWS_S3_BUCKET || '',
    s3PublicBaseUrl: parsed.AWS_S3_PUBLIC_BASE_URL || '',
    secretsManagerPrefix: parsed.AWS_SECRETS_MANAGER_PREFIX || '',
    kmsKeyId: parsed.AWS_KMS_KEY_ID || '',
    bedrockModelId: parsed.AWS_BEDROCK_MODEL_ID || '',
    textractRegion: parsed.AWS_TEXTRACT_REGION || ''
  },
  email: {
    smtpHost: parsed.SMTP_HOST || '',
    smtpPort: parsed.SMTP_PORT || 587,
    smtpUser: parsed.SMTP_USER || '',
    smtpPass: parsed.SMTP_PASS || '',
    smtpFrom: parsed.SMTP_FROM || ''
  },
  audit: {
    retentionDays: parsed.AUDIT_LOG_RETENTION_DAYS
  },
  telegram: {
    maxFileMb: parsed.TELEGRAM_MAX_FILE_MB,
    storageDir: parsed.TELEGRAM_STORAGE_DIR,
    pairingTtlMinutes: parsed.TELEGRAM_PAIRING_TTL_MINUTES,
    maxMessagesPerMinute: parsed.TELEGRAM_MAX_MESSAGES_PER_MINUTE,
    maxUploadsPerHour: parsed.TELEGRAM_MAX_UPLOADS_PER_HOUR,
    maxDeepClawTasksPerDay: parsed.TELEGRAM_MAX_DEEPCLAW_TASKS_PER_DAY
  },
  bi: {
    enabled: parsed.BI_ENABLED,
    storageDir: parsed.BI_STORAGE_DIR,
    maxUploadMb: parsed.BI_MAX_UPLOAD_MB,
    maxRowsPreview: parsed.BI_MAX_ROWS_PREVIEW,
    maxRowsInMemory: parsed.BI_MAX_ROWS_IN_MEMORY,
    enableAiInsights: parsed.BI_ENABLE_AI_INSIGHTS,
    enableInternalMetrics: parsed.BI_ENABLE_INTERNAL_METRICS
  },
  powerbi: {
    tenantId: parsed.POWERBI_TENANT_ID || '',
    clientId: parsed.POWERBI_CLIENT_ID || '',
    clientSecret: parsed.POWERBI_CLIENT_SECRET || '',
    workspaceId: parsed.POWERBI_WORKSPACE_ID || ''
  },
  oauth: {
    google: {
      clientId: parsed.OAUTH_GOOGLE_CLIENT_ID || '',
      clientSecret: parsed.OAUTH_GOOGLE_CLIENT_SECRET || '',
      enabled: Boolean(parsed.OAUTH_GOOGLE_CLIENT_ID && parsed.OAUTH_GOOGLE_CLIENT_SECRET)
    },
    github: {
      clientId: parsed.OAUTH_GITHUB_CLIENT_ID || '',
      clientSecret: parsed.OAUTH_GITHUB_CLIENT_SECRET || '',
      enabled: Boolean(parsed.OAUTH_GITHUB_CLIENT_ID && parsed.OAUTH_GITHUB_CLIENT_SECRET)
    },
    azure: {
      clientId: parsed.OAUTH_AZURE_CLIENT_ID || '',
      clientSecret: parsed.OAUTH_AZURE_CLIENT_SECRET || '',
      enabled: Boolean(parsed.OAUTH_AZURE_CLIENT_ID && parsed.OAUTH_AZURE_CLIENT_SECRET)
    }
  },
  bootstrapAdmin: {
    email: parsed.ADMIN_BOOTSTRAP_EMAIL,
    password: parsed.ADMIN_BOOTSTRAP_PASSWORD,
    name: parsed.ADMIN_BOOTSTRAP_NAME
  },
  get(key: keyof NodeJS.ProcessEnv) {
    return process.env[key];
  },
  getRequired(key: keyof NodeJS.ProcessEnv) {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Variável obrigatória ausente: ${String(key)}.`);
    }
    return value;
  },
  getBoolean(key: keyof NodeJS.ProcessEnv, fallback = false) {
    const value = process.env[key];
    if (value === undefined) return fallback;
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
  },
  getNumber(key: keyof NodeJS.ProcessEnv, fallback = 0) {
    const value = Number(process.env[key]);
    return Number.isFinite(value) ? value : fallback;
  },
  validateEnv() {
    return true;
  },
  getPublicConfig() {
    return {
      nodeEnv: parsed.NODE_ENV,
      port: this.port,
      corsOrigin: this.corsOrigin,
      appPublicUrl: this.appPublicUrl,
      webPublicUrl: this.webPublicUrl,
      storageDriver: this.storage.driver,
      telegramStorageDir: this.telegram.storageDir
    };
  },
  getDatabaseConfig() {
    return {
      databaseUrl: this.databaseUrl,
      hasDatabase: Boolean(this.databaseUrl)
    };
  },
  getAwsConfig() {
    return { ...this.aws, configured: Boolean(this.aws.region && this.aws.s3Bucket) };
  },
  getTelegramConfig() {
    return { ...this.telegram, configured: Boolean(this.appPublicUrl) };
  },
  getStorageConfig() {
    return {
      driver: this.storage.driver,
      localDir: this.storage.localDir,
      maxUploadMb: this.storage.maxUploadMb,
      configured: true
    };
  },
  getAuthConfig() {
    return {
      accessTtl: this.jwt.accessTtl,
      refreshTtl: this.jwt.refreshTtl,
      bootstrapAdminEmail: this.bootstrapAdmin.email
    };
  }
} as const;
