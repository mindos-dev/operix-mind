import type { RequestHandler } from 'express';
import type { Permission } from '../modules/security/permission.service.js';
import { hasPermission } from '../modules/security/permission.service.js';

export function requirePermission(permission: Permission): RequestHandler {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ mensagem: 'Autenticação obrigatória.' });
      return;
    }

    if (!hasPermission(user.role, permission)) {
      res.status(403).json({ mensagem: 'Permissão insuficiente para esta ação.' });
      return;
    }

    next();
  };
}

export function requireRole(roles: Array<'admin' | 'user' | 'dev' | 'enterprise'>): RequestHandler {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ mensagem: 'Autenticação obrigatória.' });
      return;
    }

    if (!roles.includes(user.role)) {
      res.status(403).json({ mensagem: 'Função insuficiente para esta ação.' });
      return;
    }

    next();
  };
}
