import { type ConversionCategory } from './conversion-catalog.js';
export interface ConversionOption {
    id: string;
    origem: string;
    destino: string;
    categoria: ConversionCategory;
    status: 'ativo' | 'preparado';
    descricao: string;
    engines: string[];
    plugin: string;
    premium?: boolean;
    requerBinarioLocal?: boolean;
    requerCredencial?: boolean;
}
export interface ConversionJob {
    id: string;
    optionId: string;
    userId: string;
    status: 'fila' | 'processando' | 'concluido';
    plugin: string;
    engines: string[];
    resultado: string;
    criadoEm: string;
}
export declare const conversionOptions: ConversionOption[];
export declare function listConversionOptions(): ConversionOption[];
export declare function listConversionPlugins(): {
    nome: string;
    software: import("./plugin.interface.js").IntegrationSoftware;
    comandos: string[];
    requerCredencial: boolean;
    requerBinarioLocal: boolean;
}[];
export declare function listConversionMatrix(): {
    de: string;
    para: string;
    categoria: ConversionCategory;
    status: import("./conversion-catalog.js").ConversionStatus;
    plugin: string;
    engines: string[];
}[];
export declare function createConversionJob(input: {
    userId: string;
    optionId: string;
}): ConversionJob;
export declare function listConversionJobs(userId: string): ConversionJob[];
