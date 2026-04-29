import { addAuditLog } from '../logs/logs.service.js';

export type ConsentScope = 'processing' | 'ai_assistance' | 'storage' | 'analytics' | 'marketing';

export interface ConsentRecord {
  userId: string;
  scope: ConsentScope;
  accepted: boolean;
  acceptedAt: string;
  version: string;
}

const consents = new Map<string, ConsentRecord[]>();

export function requestConsent(scope: ConsentScope, version = '1.0') {
  return {
    scope,
    version,
    required: true,
    message: 'O uso deste recurso depende de consentimento registrado.'
  };
}

export function recordConsent(userId: string, scope: ConsentScope, accepted: boolean, version = '1.0') {
  const entry: ConsentRecord = {
    userId,
    scope,
    accepted,
    acceptedAt: new Date().toISOString(),
    version
  };

  const current = consents.get(userId) || [];
  current.unshift(entry);
  consents.set(userId, current);

  addAuditLog({
    origem: 'privacy',
    mensagem: accepted ? 'Consentimento registrado.' : 'Consentimento recusado.',
    detalhes: { userId, scope, accepted, version }
  });

  return entry;
}

export function hasConsent(userId: string, scope: ConsentScope) {
  return (consents.get(userId) || []).some((record) => record.scope === scope && record.accepted);
}

export function listConsents(userId: string) {
  return [...(consents.get(userId) || [])];
}

export function deleteConsents(userId: string) {
  consents.delete(userId);
}
