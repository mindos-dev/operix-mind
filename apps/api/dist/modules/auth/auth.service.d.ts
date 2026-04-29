export type AuthUserRole = 'admin' | 'user' | 'dev' | 'enterprise';
export type AuthUserPlan = 'GRATIS' | 'PRO' | 'ENGENHARIA' | 'DEV' | 'EMPRESA';
export interface AuthUser {
    id: string;
    nome: string;
    email: string;
    plano: AuthUserPlan;
    role: AuthUserRole;
}
export interface AuthTokenPayload {
    sub: string;
    email: string;
    role: AuthUserRole;
    plano: AuthUserPlan;
    type: 'access' | 'refresh';
    version?: number;
}
export declare function registerUser(input: {
    nome: string;
    email: string;
    senha: string;
    role?: AuthUserRole;
    plano?: AuthUserPlan;
}): {
    usuario: AuthUser;
    accessToken: string;
    refreshToken: string;
    token: string;
    expiresIn: string;
};
export declare function loginUser(input: {
    email: string;
    senha: string;
}): {
    usuario: AuthUser;
    accessToken: string;
    refreshToken: string;
    token: string;
    expiresIn: string;
};
export declare function refreshSession(refreshToken: string): {
    usuario: AuthUser;
    accessToken: string;
    refreshToken: string;
    token: string;
    expiresIn: string;
};
export declare function logoutUser(userId: string): void;
export declare function verifyToken(token: string): AuthUser;
export declare function listUsers(): AuthUser[];
export declare function deleteUserAccount(userId: string): boolean;
export declare function ensureDemoUser(): void;
