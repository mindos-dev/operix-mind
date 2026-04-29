export type PlanoOperix = 'GRATIS' | 'PRO' | 'ENGENHARIA' | 'DEV' | 'EMPRESA';
export type TipoTarefa = 'coordenacao' | 'arquitetura' | 'debug' | 'documentacao' | 'traducao' | 'resumo' | 'codigo' | 'devops' | 'conversao' | 'local' | 'revisao';
export interface UsuarioSessao {
    id: string;
    nome: string;
    email: string;
    plano: PlanoOperix;
}
export interface ProjetoResumo {
    id: string;
    nome: string;
    descricao: string;
    status: 'rascunho' | 'em_execucao' | 'concluido' | 'erro';
    atualizadoEm: string;
}
export interface ArquivoOperix {
    id: string;
    nomeOriginal: string;
    formato: string;
    tamanhoBytes: number;
    status: 'recebido' | 'processando' | 'convertido' | 'erro';
    criadoEm: string;
}
export interface EventoTerminal {
    id: string;
    tipo: 'info' | 'comando' | 'saida' | 'erro' | 'sucesso';
    mensagem: string;
    criadoEm: string;
}
export interface RespostaApi<T> {
    dados: T;
    mensagem?: string;
}
