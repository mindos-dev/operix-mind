import 'dotenv/config';
import { config } from './config.service.js';
export const env = {
    nodeEnv: config.nodeEnv,
    port: config.port,
    corsOrigin: config.corsOrigin,
    jwtSecret: config.jwt.accessSecret,
    jwtAccessSecret: config.jwt.accessSecret,
    jwtRefreshSecret: config.jwt.refreshSecret,
    uploadMaxBytes: config.security.uploadMaxBytes,
    maxJsonBody: config.security.maxJsonBody,
    maxRequestsPerMinute: config.security.maxRequestsPerMinute,
    maxAiRequestsPerHour: config.security.maxAiRequestsPerHour,
    maxAiTokensPerHour: config.security.maxAiTokensPerHour
};
