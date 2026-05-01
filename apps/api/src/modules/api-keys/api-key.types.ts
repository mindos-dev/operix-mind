export type ApiKeyStatus = 'active' | 'revoked';

export interface ApiKeyRecord {
  id: string;
  keyPrefix: string;
  keyHash: string;
  name: string;
  scopes: string[];
  tenantId: string;
  userId: string;
  status: ApiKeyStatus;
  expiresAt?: string;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApiKeyInput {
  name: string;
  scopes?: string[];
  expiresAt?: string;
}

export interface ApiKeyPublicInfo {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  status: ApiKeyStatus;
  expiresAt?: string;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}
