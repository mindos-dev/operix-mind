export type RuntimeChoice = 'local' | 'api_barata' | 'cloud_forte' | 'bedrock_premium';
export type DeviceClass = 'low' | 'medium' | 'high';
export type TaskComplexity = 'simples' | 'media' | 'complexa' | 'critica';
export type UserPlan = 'GRATIS' | 'PRO' | 'ENGENHARIA' | 'DEV' | 'EMPRESA';
export interface DeviceProfile {
    tipoDispositivo: 'mobile' | 'desktop' | 'tablet' | 'desconhecido';
    memoriaGb?: number;
    navegador?: string;
    sistemaOperacional?: string;
    suportaWebGPU: boolean;
    suportaWasm: boolean;
    modoEconomia: boolean;
}
export interface RuntimeTask {
    tipo: string;
    prompt: string;
    tokensEstimados: number;
    requerAltaPrecisao?: boolean;
    documentoGrande?: boolean;
    debugDificil?: boolean;
}
export interface RuntimeDecision {
    runtime: RuntimeChoice;
    motivo: string;
    custoEstimadoUsd: number;
    tokensEstimados: number;
    limitePlanoUsd: number;
    risco: 'baixo' | 'medio' | 'alto';
    fallback: RuntimeChoice;
    modeloSugerido: string;
    classeDispositivo: DeviceClass;
    complexidade: TaskComplexity;
    bloqueado: boolean;
    mensagem?: string;
}
