export interface Project {
    id: string;
    nome: string;
    descricao: string;
    status: 'rascunho' | 'em_execucao' | 'concluido' | 'erro';
    userId: string;
    tenantId: string;
    criadoEm: string;
    atualizadoEm: string;
}
export declare function resetProjectsStore(): void;
export declare function createProject(input: {
    userId: string;
    tenantId: string;
    nome: string;
    descricao?: string;
}): Promise<Project>;
export declare function listProjects(tenantId: string): Promise<Project[]>;
export declare function deleteProjectsByTenantId(tenantId: string): Promise<void>;
export declare function ensureDemoProject(userId: string, tenantId: string): Promise<void>;
