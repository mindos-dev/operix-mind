export type IntegrationSoftware =
  | 'documents'
  | 'images'
  | 'media'
  | 'fusion360'
  | 'solidworks'
  | 'freecad'
  | 'cura'
  | 'prusaslicer'
  | 'kicad'
  | 'openscad'
  | 'blender'
  | 'libreoffice';

export interface PluginIntegracao {
  nome: string;
  software: IntegrationSoftware;
  comandos: string[];
  requerCredencial?: boolean;
  requerBinarioLocal?: boolean;
  executar(arquivo: string, params: Record<string, unknown>): Promise<Buffer>;
  converter(entrada: string, saida: string): Promise<string>;
}

export class MockConversionPlugin implements PluginIntegracao {
  constructor(
    public nome: string,
    public software: IntegrationSoftware,
    public comandos: string[],
    public requerCredencial = false,
    public requerBinarioLocal = false
  ) {}

  async executar(arquivo: string, params: Record<string, unknown>): Promise<Buffer> {
    return Buffer.from(JSON.stringify({ arquivo, params, plugin: this.nome, status: 'mock' }));
  }

  async converter(entrada: string, saida: string): Promise<string> {
    return `${this.software}:${entrada}->${saida}`;
  }
}
