export type TelegramIntegrationStatus = 'pending' | 'active' | 'disabled' | 'error';
export type TelegramPairingStatus = 'pending' | 'completed' | 'expired' | 'cancelled';

export interface TelegramBotProfile {
  botId: string;
  botUsername: string;
  botName: string;
}

export interface TelegramIntegrationRecord {
  id: string;
  userId: string;
  tenantId: string;
  botId: string;
  botUsername: string;
  botName: string;
  encryptedBotToken: string;
  webhookSecret: string;
  status: TelegramIntegrationStatus;
  chatId?: string;
  telegramUserId?: string;
  allowedTelegramUserIds?: string[];
  createdAt: string;
  updatedAt: string;
  connectedAt?: string;
  lastUpdateAt?: string;
  lastError?: string;
}

export interface TelegramPairingSessionRecord {
  id: string;
  integrationId: string;
  userId: string;
  pairingCode: string;
  status: TelegramPairingStatus;
  expiresAt: string;
  createdAt: string;
  completedAt?: string;
}

export interface TelegramFileRecord {
  id: string;
  integrationId: string;
  userId: string;
  chatId: string;
  telegramFileId: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  localPath: string;
  classification: 'publico' | 'interno' | 'sensivel' | 'critico';
  scanStatus: 'pending' | 'ok' | 'blocked';
  createdAt: string;
}

export interface TelegramTaskRecord {
  id: string;
  integrationId: string;
  userId: string;
  chatId: string;
  command: string;
  prompt: string;
  fileIds?: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  resultSummary?: string;
  resultFilePath?: string;
  createdAt: string;
  completedAt?: string;
}

export interface TelegramConnectResult {
  integrationId: string;
  botUsername: string;
  botName: string;
  pairingCode: string;
  deepLink: string;
  qrCodeDataUrl: string;
  expiresAt: string;
  status: TelegramIntegrationStatus;
  warning?: string;
}

export interface TelegramWebhookReply {
  replyText?: string;
  taskId?: string;
  fileIds?: string[];
  handled: boolean;
}
