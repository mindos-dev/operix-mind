import { mkdirSync } from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { getQuarantineDir, getUploadLimitBytes, isAllowedUpload, sanitizeFilename } from '../modules/security/file-security.service.js';

const uploadDir = getQuarantineDir();
const allowedExtensions = new Set([
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'csv',
  'txt',
  'md',
  'html',
  'json',
  'xml',
  'png',
  'jpg',
  'jpeg',
  'webp',
  'dwg',
  'dxf'
]);

mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDir);
  },
  filename: (_req, file, callback) => {
    const safeName = sanitizeFilename(file.originalname);
    callback(null, `${Date.now()}-${safeName}`);
  }
});

export const uploadSingleFile = multer({
  storage,
  limits: {
    fileSize: getUploadLimitBytes()
  },
  fileFilter: (_req, file, callback) => {
    const extension = file.originalname.includes('.') ? file.originalname.split('.').pop()?.toLowerCase() : '';

    if (!extension || !allowedExtensions.has(extension) || !isAllowedUpload(file.originalname, file.mimetype)) {
      callback(new Error('Formato de arquivo não permitido.'));
      return;
    }

    callback(null, true);
  }
}).single('arquivo');
