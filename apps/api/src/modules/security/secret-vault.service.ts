import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { config } from '../../config/config.service.js';

function resolveKey() {
  const secret = config.secretEncryptionKey || (config.nodeEnv === 'production' ? '' : 'mind_ia-dev-secret-key');
  if (!secret && config.nodeEnv === 'production') {
    throw new Error('SECRET_ENCRYPTION_KEY ausente em produção.');
  }

  return createHash('sha256').update(secret).digest();
}

export function encryptSecret(plain: string): string {
  const key = resolveKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`;
}

export function decryptSecret(cipher: string): string {
  const [version, ivB64, tagB64, ciphertextB64] = cipher.split(':');
  if (version !== 'v1' || !ivB64 || !tagB64 || !ciphertextB64) {
    throw new Error('Segredo criptografado inválido.');
  }

  const key = resolveKey();
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const plain = Buffer.concat([decipher.update(Buffer.from(ciphertextB64, 'base64')), decipher.final()]);
  return plain.toString('utf8');
}

export function maskSecret(secret: string): string {
  if (!secret) return '';
  if (secret.length <= 8) return '[redacted]';
  return `${secret.slice(0, 4)}...${secret.slice(-4)}`;
}
