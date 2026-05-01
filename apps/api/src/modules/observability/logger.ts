import pino from 'pino';
import { config } from '../../config/config.service.js';

export const logger = pino({
  level: config.logging.level,
  transport: config.logging.pretty || config.nodeEnv !== 'production'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          singleLine: true
        }
      }
    : undefined,
  base: {
    service: 'Mind_IA API'
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.body.senha',
      'req.body.password',
      'req.body.refreshToken',
      'req.body.token',
      'req.body.accessToken',
      'req.body.secret'
    ],
    censor: '[redacted]'
  }
});
