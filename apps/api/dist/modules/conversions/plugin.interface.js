export class MockConversionPlugin {
    nome;
    software;
    comandos;
    requerCredencial;
    requerBinarioLocal;
    constructor(nome, software, comandos, requerCredencial = false, requerBinarioLocal = false) {
        this.nome = nome;
        this.software = software;
        this.comandos = comandos;
        this.requerCredencial = requerCredencial;
        this.requerBinarioLocal = requerBinarioLocal;
    }
    async executar(arquivo, params) {
        return Buffer.from(JSON.stringify({ arquivo, params, plugin: this.nome, status: 'mock' }));
    }
    async converter(entrada, saida) {
        return `${this.software}:${entrada}->${saida}`;
    }
}
