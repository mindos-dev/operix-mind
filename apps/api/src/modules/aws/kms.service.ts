import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { config } from '../../config/config.service.js';

export async function kmsEncrypt(plain: string) {
  if (!config.secretEncryptionKey) {
    return plain;
  }

  const key = Buffer.from(config.secretEncryptionKey.padEnd(32, '0').slice(0, 32));
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `kms:v1:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export async function kmsDecrypt(ciphertext: string) {
  if (!ciphertext.startsWith('kms:v1:')) {
    return ciphertext;
  }

  const key = Buffer.from(config.secretEncryptionKey.padEnd(32, '0').slice(0, 32));
  const [, , iv, tag, encrypted] = ciphertext.split(':');
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64')), decipher.final()]).toString('utf8');
}
