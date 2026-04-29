import { addLog } from '../modules/logs/logs.service.js';
export const errorMiddleware = (error, _req, res, _next) => {
    addLog({
        level: 'erro',
        origem: 'api',
        mensagem: 'Erro interno tratado pela API.',
        detalhes: error instanceof Error ? error.message : error
    });
    res.status(500).json({
        mensagem: 'Erro interno da API Mind_IA.'
    });
};
