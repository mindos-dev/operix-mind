import { type PluginIntegracao } from './plugin.interface.js';
export type ConversionCategory = 'documentos' | 'pdf_avancado' | 'planilhas' | 'imagens' | 'cad_engenharia' | 'eletronica_gerber' | 'midia';
export type ConversionStatus = 'ativo' | 'preparado';
export interface ConversionCapability {
    id: string;
    origem: string;
    destino: string;
    categoria: ConversionCategory;
    status: ConversionStatus;
    descricao: string;
    engines: string[];
    plugin: string;
    premium?: boolean;
    requerBinarioLocal?: boolean;
    requerCredencial?: boolean;
}
export declare const conversionPlugins: PluginIntegracao[];
export declare const conversionCapabilities: ConversionCapability[];
export declare function findPluginByName(nome: string): PluginIntegracao | undefined;
export declare function buildConversionMatrix(): {
    de: string;
    para: string;
    categoria: ConversionCategory;
    status: ConversionStatus;
    plugin: string;
    engines: string[];
}[];
