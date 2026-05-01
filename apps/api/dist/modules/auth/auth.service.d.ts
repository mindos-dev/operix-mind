export type AuthUserRole = 'admin' | 'user' | 'dev' | 'enterprise';
export type AuthUserPlan = 'GRATIS' | 'PRO' | 'ENGENHARIA' | 'DEV' | 'EMPRESA';
export interface AuthUser {
    id: string;
    nome: string;
    email: string;
    plano: AuthUserPlan;
    role: AuthUserRole;
    tenantId: string;
    tenantNome?: string;
    deviceId?: string;
}
export interface AuthTokenPayload {
    sub: string;
    email: string;
    name: string;
    role: AuthUserRole;
    plano: AuthUserPlan;
    tenantId: string;
    tenantNome?: string;
    deviceId: string;
    type: 'access' | 'refresh';
    version?: number;
}
interface StoredUser extends AuthUser {
    senhaHash: string;
    consentedAt?: string;
    refreshTokenVersion: number;
}
export declare function resetAuthStore(): void;
export declare function issueSessionForUser(user: AuthUser, refreshTokenVersion?: number, deviceId?: string): {
    usuario: AuthUser;
    accessToken: string;
    refreshToken: string;
    token: string;
    expiresIn: string;
};
export declare function registerUser(input: {
    nome: string;
    email: string;
    senha: string;
    role?: AuthUserRole;
    plano?: AuthUserPlan;
}): Promise<{
    usuario: AuthUser;
    accessToken: string;
    refreshToken: string;
    token: string;
    expiresIn: string;
}>;
export declare function loginUser(input: {
    email: string;
    senha: string;
}): Promise<{
    usuario: AuthUser;
    accessToken: string;
    refreshToken: string;
    token: string;
    expiresIn: string;
}>;
export declare function refreshSession(refreshToken: string): Promise<{
    usuario: AuthUser;
    accessToken: string;
    refreshToken: string;
    token: string;
    expiresIn: string;
}>;
export declare function logoutUser(userId: string, deviceId?: string): Promise<void>;
export declare function verifyToken(token: string): AuthUser;
export declare function listUsers(): Promise<AuthUser[] | {
    id: string;
    nome: string;
    email: string;
    plano: AuthUserPlan;
    role: AuthUserRole;
    tenantId: string;
    tenantNome: string;
}[]>;
export declare function deleteUserAccount(userId: string): Promise<boolean>;
export declare function ensureDemoUser(): void;
export declare function ensureBootstrapAdmin(): void;
export declare function bootstrapPersistentAccounts(): Promise<void>;
export declare function getUserByEmail(email: string): Promise<StoredUser | {
    id: string;
    nome: string;
    email: string;
    plano: AuthUserPlan;
    role: AuthUserRole;
    tenantId: string;
    tenantNome: string;
    senhaHash: string;
    refreshTokenVersion: number;
}>;
export declare function getUserById(id: string): Promise<StoredUser | {
    id: string;
    nome: string;
    email: string;
    plano: AuthUserPlan;
    role: AuthUserRole;
    tenantId: string;
    tenantNome: string;
    senhaHash: string;
    refreshTokenVersion: number;
}>;
export declare function storeUserConsentAccepted(userId: string): Promise<void>;
export declare function getTokenVersionForDevice(userId: string, deviceId: string): number;
export {};
