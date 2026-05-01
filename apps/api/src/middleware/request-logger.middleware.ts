import type { RequestHandler } from 'express';
import { logger } from '../modules/observability/logger.js';
import { recordHttpRequest } from '../modules/observability/observability.service.js';

export const requestLoggerMiddleware: RequestHandler = (req, res, next) => {
  const startedAt = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const metric = {
      method: req.method,
      route: req.originalUrl.split('?')[0],
      statusCode: res.statusCode,
      durationMs,
      at: new Date().toISOString()
    };

    recordHttpRequest(metric);
    logger.info({
      req: {
        method: metric.method,
        route: metric.route
      },
      res: {
        statusCode: metric.statusCode
      },
      durationMs: metric.durationMs
    }, 'http request completed');
  });

  next();
};
