import { mkdirSync, readdirSync, statSync } from 'node:fs';
import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../../config/config.service.js';

export interface StoredFileRef {
  driver: 'local' | 's3';
  key: string;
  path: string;
  bucket?: string;
  url?: string;
  sizeBytes?: number;
}

export interface SaveFileInput {
  tenantId: string;
  userId: string;
  filename: string;
  sourcePath?: string;
  buffer?: Buffer;
  mimeType?: string;
}

const localStorageDir = path.resolve(process.cwd(), config.storage.localDir || 'storage');
let s3Client: S3Client | null = null;

function ensureDir(dir: string) {
  mkdirSync(dir, { recursive: true });
}

function getS3Client() {
  if (!config.aws.region || !config.aws.s3Bucket) return null;
  if (!s3Client) {
    s3Client = new S3Client({
      region: config.aws.region,
      credentials: config.aws.accessKeyId && config.aws.secretAccessKey
        ? {
            accessKeyId: config.aws.accessKeyId,
            secretAccessKey: config.aws.secretAccessKey
          }
        : undefined
    });
  }
  return s3Client;
}

export function getLocalStorageDir() {
  ensureDir(localStorageDir);
  return localStorageDir;
}

export function getTenantStorageDir(tenantId: string, userId?: string) {
  const safeTenant = tenantId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  const safeUser = userId ? userId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80) : 'global';
  const dir = path.join(getLocalStorageDir(), safeTenant, safeUser);
  ensureDir(dir);
  return dir;
}

export function classifyStoragePath(ref: string) {
  return ref.startsWith('s3://') ? 's3' : 'local';
}

function buildKey(input: SaveFileInput) {
  const safeFilename = input.filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180);
  return `${input.tenantId}/${input.userId}/${Date.now()}-${safeFilename}`;
}

export async function saveFile(input: SaveFileInput): Promise<StoredFileRef> {
  const key = buildKey(input);
  const driver = config.storage.driver === 's3' && getS3Client() ? 's3' : 'local';
  const buffer = input.buffer || (input.sourcePath ? await readFile(input.sourcePath) : Buffer.alloc(0));

  if (driver === 's3') {
    const client = getS3Client();
    if (!client) {
      throw new Error('Storage S3 não configurado.');
    }
    await client.send(new PutObjectCommand({
      Bucket: config.aws.s3Bucket,
      Key: key,
      Body: buffer,
      ContentType: input.mimeType || 'application/octet-stream'
    }));
    return {
      driver,
      key,
      path: `s3://${config.aws.s3Bucket}/${key}`,
      bucket: config.aws.s3Bucket,
      sizeBytes: buffer.length,
      url: config.aws.s3PublicBaseUrl ? `${config.aws.s3PublicBaseUrl.replace(/\/$/, '')}/${key}` : undefined
    };
  }

  const localDir = getTenantStorageDir(input.tenantId, input.userId);
  const fullPath = path.join(localDir, key.split('/').pop() || 'file.bin');
  await writeFile(fullPath, buffer);
  return {
    driver,
    key,
    path: fullPath,
    sizeBytes: buffer.length,
    url: `file://${fullPath}`
  };
}

export async function getFile(ref: StoredFileRef | string) {
  const pathRef = typeof ref === 'string' ? ref : ref.path;
  if (classifyStoragePath(pathRef) === 's3') {
    const client = getS3Client();
    if (!client) throw new Error('Storage S3 não configurado.');
    const [, bucket, ...keyParts] = pathRef.split('/');
    const key = keyParts.join('/');
    const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const body = response.Body as unknown as { transformToByteArray?: () => Promise<Uint8Array> };
    if (body?.transformToByteArray) {
      return Buffer.from(await body.transformToByteArray());
    }
    throw new Error('Corpo S3 indisponível.');
  }

  return readFile(pathRef);
}

export async function deleteFile(ref: StoredFileRef | string) {
  const pathRef = typeof ref === 'string' ? ref : ref.path;
  if (classifyStoragePath(pathRef) === 's3') {
    const client = getS3Client();
    if (!client) return false;
    const [, bucket, ...keyParts] = pathRef.split('/');
    const key = keyParts.join('/');
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  }

  await rm(pathRef, { force: true });
  return true;
}

export async function exists(ref: StoredFileRef | string) {
  const pathRef = typeof ref === 'string' ? ref : ref.path;
  if (classifyStoragePath(pathRef) === 's3') {
    const client = getS3Client();
    if (!client) return false;
    const [, bucket, ...keyParts] = pathRef.split('/');
    const key = keyParts.join('/');
    try {
      await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      return true;
    } catch {
      return false;
    }
  }

  try {
    statSync(pathRef);
    return true;
  } catch {
    return false;
  }
}

export async function getSignedUrlForFile(ref: StoredFileRef | string, expiresIn = 60 * 15) {
  const pathRef = typeof ref === 'string' ? ref : ref.path;
  if (classifyStoragePath(pathRef) === 's3') {
    const client = getS3Client();
    if (!client) throw new Error('Storage S3 não configurado.');
    const [, bucket, ...keyParts] = pathRef.split('/');
    const key = keyParts.join('/');
    return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
  }

  return `file://${path.resolve(pathRef)}`;
}

export async function migrateLocalToS3(sourceDir = getLocalStorageDir()) {
  const client = getS3Client();
  if (!client) {
    return { ok: false, migrated: 0, message: 'S3 não configurado.' };
  }

  const files = readdirSync(sourceDir, { withFileTypes: true });
  let migrated = 0;

  for (const entry of files) {
    const fullPath = path.join(sourceDir, entry.name);
    if (entry.isDirectory()) {
      const nested = await migrateLocalToS3(fullPath);
      migrated += nested.migrated;
      continue;
    }

    const body = await readFile(fullPath);
    const key = path.relative(sourceDir, fullPath).replace(/\\/g, '/');
    await client.send(new PutObjectCommand({
      Bucket: config.aws.s3Bucket,
      Key: key,
      Body: body
    }));
    migrated += 1;
  }

  return { ok: true, migrated, bucket: config.aws.s3Bucket };
}

export async function listStoredFiles(prefix = '') {
  const client = getS3Client();
  if (!client) {
    return [];
  }

  const response = await client.send(new ListObjectsV2Command({
    Bucket: config.aws.s3Bucket,
    Prefix: prefix || undefined
  }));

  return (response.Contents || []).map((item) => ({
    key: item.Key || '',
    sizeBytes: item.Size || 0,
    lastModified: item.LastModified?.toISOString() || ''
  }));
}

export function ensureStorageFolders() {
  ensureDir(getLocalStorageDir());
  ensureDir(path.join(getLocalStorageDir(), 'uploads'));
  ensureDir(path.join(getLocalStorageDir(), 'backups'));
}

ensureStorageFolders();
