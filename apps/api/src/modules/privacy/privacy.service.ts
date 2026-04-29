import { deleteUserAccount, listUsers } from '../auth/auth.service.js';
import { purgeLogsByUserId } from '../logs/logs.service.js';
import { deleteFilesByUserId, listFiles } from '../files/files.service.js';
import { deleteProjectsByUserId, listProjects } from '../projects/projects.service.js';
import { deleteConsents, listConsents, recordConsent, requestConsent, type ConsentScope } from './consent.service.js';

export function registerUserConsent(userId: string, scope: ConsentScope, accepted: boolean, version = '1.0') {
  return recordConsent(userId, scope, accepted, version);
}

export function getConsentRequest(scope: ConsentScope) {
  return requestConsent(scope);
}

export function exportUserData(userId: string) {
  const user = listUsers().find((entry) => entry.id === userId);
  return {
    user,
    consents: listConsents(userId),
    files: listFiles(userId),
    projects: listProjects(userId),
    exportGeneratedAt: new Date().toISOString()
  };
}

export function deleteUserData(userId: string) {
  deleteProjectsByUserId(userId);
  deleteFilesByUserId(userId);
  deleteConsents(userId);
  purgeLogsByUserId(userId);
  return deleteUserAccount(userId);
}
