import type { AuthUserRole } from '../auth/auth.service.js';

export type Permission =
  | 'ai:execute'
  | 'ai:premium'
  | 'files:read'
  | 'files:write'
  | 'projects:read'
  | 'projects:write'
  | 'logs:read'
  | 'privacy:export'
  | 'privacy:delete'
  | 'security:read'
  | 'integrations:connect'
  | 'runtime:decide';

const rolePermissions: Record<AuthUserRole, Permission[]> = {
  admin: ['ai:execute', 'ai:premium', 'files:read', 'files:write', 'projects:read', 'projects:write', 'logs:read', 'privacy:export', 'privacy:delete', 'security:read', 'integrations:connect', 'runtime:decide'],
  enterprise: ['ai:execute', 'ai:premium', 'files:read', 'files:write', 'projects:read', 'projects:write', 'logs:read', 'privacy:export', 'privacy:delete', 'security:read', 'integrations:connect', 'runtime:decide'],
  dev: ['ai:execute', 'files:read', 'files:write', 'projects:read', 'projects:write', 'logs:read', 'security:read', 'runtime:decide'],
  user: ['ai:execute', 'files:read', 'files:write', 'projects:read', 'projects:write', 'privacy:export', 'privacy:delete', 'runtime:decide']
};

export function hasPermission(role: AuthUserRole, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}

export function permissionsForRole(role: AuthUserRole): Permission[] {
  return [...rolePermissions[role]];
}
