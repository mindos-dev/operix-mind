export interface AuthUser {
    id: string;
    nome: string;
    email: string;
    plano: 'GRATIS' | 'PRO' | 'ENGENHARIA' | 'DEV' | 'EMPRESA';
}
export declare function registerUser(input: {
    nome: string;
    email: string;
    senha: string;
}): {
    usuario: AuthUser;
    token: string;
};
export declare function loginUser(input: {
    email: string;
    senha: string;
}): {
    usuario: AuthUser;
    token: string;
};
export declare function verifyToken(token: string): AuthUser;
export declare function ensureDemoUser(): void;
