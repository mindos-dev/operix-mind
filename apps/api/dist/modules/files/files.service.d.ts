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
    tenantId: string;
    criadoEm: string;
}
export declare function resetFilesStore(): void;
export declare function createFileRecord(input: {
    userId: string;
    tenantId: string;
    nomeOriginal: string;
    tamanhoBytes: number;
    nomeArmazenado?: string;
    caminho?: string;
    mimetype?: string;
}): Promise<FileRecord>;
export declare function persistUploadedFile(input: {
    tenantId: string;
    userId: string;
    sourcePath: string;
    originalName: string;
}): Promise<{
    nomeArmazenado: string;
    caminho: string;
}>;
export declare function listFiles(tenantId: string): Promise<FileRecord[] | {
    id: string;
    nomeOriginal: string;
    formato: string;
    tamanhoBytes: number;
    caminho: string;
    status: FileRecord["status"];
    userId: string;
    tenantId: string;
    criadoEm: string;
}[]>;
export declare function getFileRecord(tenantId: string, fileId: string): Promise<FileRecord>;
export declare function deleteFilesByTenantId(tenantId: string): Promise<void>;
