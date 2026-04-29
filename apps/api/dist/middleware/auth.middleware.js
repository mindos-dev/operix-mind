import { verifyToken } from '../modules/auth/auth.service.js';
export const authMiddleware = (req, res, next) => {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) {
        res.status(401).json({ mensagem: 'Token de autenticação não informado.' });
        return;
    }
    try {
        req.user = verifyToken(token);
        next();
    }
    catch (_error) {
        res.status(401).json({ mensagem: 'Token inválido ou expirado.' });
    }
};
