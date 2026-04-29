import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { config } from '../../config/config.service.js';

const quarantineDir = path.resolve(process.cwd(), 'storage/uploads/quarantine');

const mimeByExtension: Record<string, string[]> = {
  pdf: ['application/pdf'],
  doc: ['application/msword'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  xls: ['application/vnd.ms-excel'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  csv: ['text/csv', 'application/csv', 'text/plain'],
  txt: ['text/plain'],
  md: ['text/markdown', 'text/plain'],
  html: ['text/html'],
  json: ['application/json', 'text/json', 'text/plain'],
  xml: ['application/xml', 'text/xml'],
  png: ['image/png'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  webp: ['image/webp'],
  dwg: ['application/octet-stream', 'application/dwg'],
  dxf: ['application/dxf', 'application/octet-stream']
};

const suspiciousBytes = [
  Buffer.from('MZ'),
  Buffer.from('#!/bin/sh'),
  Buffer.from('<?php'),
  Buffer.from('powershell', 'utf8')
];

mkdirSync(quarantineDir, { recursive: true });

export function getQuarantineDir() {
  return quarantineDir;
}

export function isAllowedUpload(originalName: string, mimetype: string): boolean {
  const extension = originalName.includes('.') ? originalName.split('.').pop()?.toLowerCase() : '';
  if (!extension) return false;
  const allowed = mimeByExtension[extension];
  if (!allowed) return false;
  return allowed.includes(mimetype) || mimetype === 'application/octet-stream';
}

export function scanFileForThreats(filePath: string) {
  const buffer = readFileSync(filePath);
  return suspiciousBytes.some((needle) => buffer.includes(needle));
}

export function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180);
}

export function getUploadLimitBytes() {
  return config.security.uploadMaxBytes;
}
