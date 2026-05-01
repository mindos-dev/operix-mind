import { createHash, randomBytes } from 'node:crypto';
import { config } from '../../config/config.service.js';

export function generateWebhookSecret() {
  return randomBytes(24).toString('hex');
}

export function generatePairingCode() {
  return randomBytes(4).toString('hex').toUpperCase();
}

export function isAllowedTelegramFile(filename: string, mimeType: string) {
  const extension = filename.includes('.') ? filename.split('.').pop()?.toLowerCase() : '';
  const allowed = new Set(['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'csv', 'zip', 'mp3', 'wav', 'ogg']);
  if (!extension || !allowed.has(extension)) return false;
  if (mimeType.startsWith('image/') || mimeType.startsWith('audio/') || mimeType === 'application/pdf' || mimeType === 'application/zip' || mimeType === 'application/x-zip-compressed') {
    return true;
  }
  return mimeType === 'application/octet-stream' || mimeType === 'text/plain';
}

export function sanitizeTelegramFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180);
}

export function getTelegramMaxFileBytes() {
  return config.telegram.maxFileMb * 1024 * 1024;
}

export function hashChatId(chatId: string) {
  return createHash('sha256').update(chatId).digest('hex');
}

const messageCounters = new Map<string, { count: number; windowStart: number }>();

export function checkTelegramRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = messageCounters.get(key);
  if (!entry || now - entry.windowStart > windowMs) {
    messageCounters.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}
