import path from 'node:path';
import { config } from '../../config/config.service.js';
import { addSecurityLog } from '../logs/logs.service.js';
import type { AuthUser } from '../auth/auth.service.js';
import type { BiDataSourceType } from './bi.types.js';

const allowedExtensions = new Set(['xlsx', 'xls', 'csv', 'json', 'txt', 'xml', 'pdf']);

export function isBiEnabled() {
  return Boolean(config.bi.enabled);
}

export function sanitizeBiName(value: string) {
  return value.trim().replace(/\s+/g, ' ').slice(0, 120);
}

export function sanitizeBiSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function getBiStorageDir() {
  return path.resolve(process.cwd(), config.bi.storageDir);
}

export function checkBiUploadAllowed(originalName: string, sizeBytes: number) {
  const extension = originalName.includes('.') ? originalName.split('.').pop()?.toLowerCase() : '';
  if (!extension || !allowedExtensions.has(extension)) {
    throw new Error('Formato BI não permitido.');
  }

  if (sizeBytes > config.bi.maxUploadMb * 1024 * 1024) {
    throw new Error('Arquivo excede o limite do BI.');
  }
}

export function validateBiAccess(user: AuthUser, ownerTenantId: string) {
  if (user.role !== 'admin' && user.role !== 'enterprise' && user.role !== 'dev' && user.tenantId !== ownerTenantId) {
    throw new Error('Acesso BI negado.');
  }
}

export function inferBiSourceType(originalName: string, fallback: BiDataSourceType = 'rest_api'): BiDataSourceType {
  const extension = originalName.includes('.') ? originalName.split('.').pop()?.toLowerCase() : '';
  if (extension === 'xlsx' || extension === 'xls') return 'file_excel';
  if (extension === 'csv') return 'file_csv';
  if (extension === 'json') return 'file_json';
  if (extension === 'xml') return 'file_xml';
  if (extension === 'txt') return 'file_txt';
  if (extension === 'pdf') return 'file_pdf';
  return fallback;
}

export async function logBiSecurity(message: string, details?: unknown, tenantId?: string, userId?: string) {
  await addSecurityLog('bi', message, details, tenantId, userId);
}
