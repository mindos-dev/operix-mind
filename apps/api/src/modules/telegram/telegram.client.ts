import { config } from '../../config/config.service.js';

export interface TelegramBotInfo {
  ok: boolean;
  result: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username: string;
  };
}

export interface TelegramFileInfo {
  ok: boolean;
  result: {
    file_id: string;
    file_unique_id: string;
    file_size?: number;
    file_path?: string;
  };
}

async function telegramJson<T>(token: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  if (!response.ok) {
    throw new Error(`Telegram API ${method} falhou.`);
  }
  return response.json() as Promise<T>;
}

export async function getTelegramBotInfo(token: string) {
  return telegramJson<TelegramBotInfo>(token, 'getMe');
}

export async function setTelegramWebhook(token: string, webhookUrl: string) {
  return telegramJson<{ ok: boolean }>(token, 'setWebhook', { url: webhookUrl, drop_pending_updates: true });
}

export async function deleteTelegramWebhook(token: string) {
  return telegramJson<{ ok: boolean }>(token, 'deleteWebhook', { drop_pending_updates: true });
}

export async function sendTelegramMessage(token: string, chatId: string, text: string) {
  return telegramJson<{ ok: boolean }>(token, 'sendMessage', { chat_id: chatId, text, parse_mode: 'HTML' });
}

export async function getTelegramFile(token: string, fileId: string) {
  return telegramJson<TelegramFileInfo>(token, 'getFile', { file_id: fileId });
}

export function getTelegramWebhookUrl(secret: string) {
  if (!config.appPublicUrl) {
    return '';
  }
  return `${config.appPublicUrl.replace(/\/+$/, '')}/telegram/webhook/${secret}`;
}

export function getTelegramDeepLink(botUsername: string, pairingCode: string) {
  return `https://t.me/${botUsername}?start=${pairingCode}`;
}
