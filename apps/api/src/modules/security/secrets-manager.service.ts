import { randomUUID } from 'node:crypto';
import { SecretsManagerClient, GetSecretValueCommand, PutSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { config } from '../../config/config.service.js';

const localSecrets = new Map<string, string>();
let secretsClient: SecretsManagerClient | null = null;

function getClient() {
  if (!config.aws.secretsManagerPrefix || !config.aws.region) {
    return null;
  }

  if (!secretsClient) {
    secretsClient = new SecretsManagerClient({
      region: config.aws.region,
      credentials: config.aws.accessKeyId && config.aws.secretAccessKey
        ? {
            accessKeyId: config.aws.accessKeyId,
            secretAccessKey: config.aws.secretAccessKey
          }
        : undefined
    });
  }

  return secretsClient;
}

function secretName(name: string) {
  return config.aws.secretsManagerPrefix ? `${config.aws.secretsManagerPrefix}/${name}` : name;
}

export async function getSecret(name: string) {
  const client = getClient();
  if (!client) {
    return localSecrets.get(name) || process.env[name] || '';
  }

  const response = await client.send(new GetSecretValueCommand({ SecretId: secretName(name) }));
  return response.SecretString || '';
}

export async function setSecret(name: string, value: string) {
  const client = getClient();
  if (!client) {
    if (config.nodeEnv === 'production') {
      throw new Error('AWS Secrets Manager não está configurado.');
    }
    localSecrets.set(name, value);
    return { ok: true, source: 'local', version: randomUUID() };
  }

  const response = await client.send(new PutSecretValueCommand({
    SecretId: secretName(name),
    SecretString: value
  }));

  return { ok: true, source: 'aws', version: response.VersionId || randomUUID() };
}

export async function rotateSecret(name: string) {
  return setSecret(name, randomUUID().replace(/-/g, ''));
}

export async function validateSecret(name: string) {
  const value = await getSecret(name);
  if (!value) {
    throw new Error(`Segredo ausente: ${name}`);
  }
  return true;
}

export function maskSecret(value: string) {
  if (!value) return '';
  if (value.length <= 8) return '***';
  return `${value.slice(0, 3)}***${value.slice(-3)}`;
}
