export interface AutomationFlow {
    id: string;
    titulo: string;
    descricao: string;
    entrada: 'arquivo' | 'texto' | 'codigo' | 'conversa' | 'planilha';
    saida: string;
    usaGemma: boolean;
    premium: boolean;
}
export declare const automationFlows: AutomationFlow[];
export declare function listAutomationFlows(): AutomationFlow[];
export declare function runAutomation(input: {
    userId: string;
    flowId: string;
    texto?: string;
}): {
    id: `${string}-${string}-${string}-${string}-${string}`;
    flowId: string;
    status: string;
    aviso: string;
    etapas: string[];
    criadoEm: string;
};
