export interface Project {
    id: string;
    nome: string;
    descricao: string;
    status: 'rascunho' | 'em_execucao' | 'concluido' | 'erro';
    userId: string;
    criadoEm: string;
    atualizadoEm: string;
}
export declare function createProject(input: {
    userId: string;
    nome: string;
    descricao?: string;
}): Project;
export declare function listProjects(userId: string): Project[];
export declare function deleteProjectsByUserId(userId: string): void;
export declare function ensureDemoProject(userId: string): void;
