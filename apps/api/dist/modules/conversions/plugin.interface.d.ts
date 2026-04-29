export type IntegrationSoftware = 'documents' | 'images' | 'media' | 'fusion360' | 'solidworks' | 'freecad' | 'cura' | 'prusaslicer' | 'kicad' | 'openscad' | 'blender' | 'libreoffice';
export interface PluginIntegracao {
    nome: string;
    software: IntegrationSoftware;
    comandos: string[];
    requerCredencial?: boolean;
    requerBinarioLocal?: boolean;
    executar(arquivo: string, params: Record<string, unknown>): Promise<Buffer>;
    converter(entrada: string, saida: string): Promise<string>;
}
export declare class MockConversionPlugin implements PluginIntegracao {
    nome: string;
    software: IntegrationSoftware;
    comandos: string[];
    requerCredencial: boolean;
    requerBinarioLocal: boolean;
    constructor(nome: string, software: IntegrationSoftware, comandos: string[], requerCredencial?: boolean, requerBinarioLocal?: boolean);
    executar(arquivo: string, params: Record<string, unknown>): Promise<Buffer>;
    converter(entrada: string, saida: string): Promise<string>;
}
