export interface FileRecord {
    id: string;
    nomeOriginal: string;
    nomeArmazenado?: string;
    formato: string;
    tamanhoBytes: number;
    caminho?: string;
    mimetype?: string;
    status: 'recebido' | 'processando' | 'convertido' | 'erro';
    userId: string;
    criadoEm: string;
}
export declare function createFileRecord(input: {
    userId: string;
    nomeOriginal: string;
    tamanhoBytes: number;
    nomeArmazenado?: string;
    caminho?: string;
    mimetype?: string;
}): FileRecord;
export declare function listFiles(userId: string): FileRecord[];
