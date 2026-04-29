import type { RequestHandler } from 'express';
import { type AuthUser } from '../modules/auth/auth.service.js';
declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}
export declare const authMiddleware: RequestHandler;
