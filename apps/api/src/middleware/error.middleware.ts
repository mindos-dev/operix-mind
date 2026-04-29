import type { ErrorRequestHandler } from 'express';
import { addErrorLog } from '../modules/logs/logs.service.js';

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  addErrorLog('api', 'Erro interno tratado pela API.', error instanceof Error ? error.message : error);

  res.status(500).json({
    mensagem: 'Erro interno da API Mind_IA.'
  });
};
