export interface IntegrationInfo {
    id: string;
    nome: string;
    status: 'desconectado' | 'preparado' | 'conectado';
    descricao: string;
    credenciais: string[];
    premium?: boolean;
}
export declare const integrations: IntegrationInfo[];
export declare function listIntegrations(): IntegrationInfo[];
