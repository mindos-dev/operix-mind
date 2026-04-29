import { randomUUID } from 'node:crypto';
import { addLog } from '../logs/logs.service.js';

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

const files: FileRecord[] = [];

export function createFileRecord(input: {
  userId: string;
  nomeOriginal: string;
  tamanhoBytes: number;
  nomeArmazenado?: string;
  caminho?: string;
  mimetype?: string;
}) {
  const extension = input.nomeOriginal.includes('.') ? input.nomeOriginal.split('.').pop() || 'desconhecido' : 'desconhecido';
  const file: FileRecord = {
    id: randomUUID(),
    nomeOriginal: input.nomeOriginal,
    nomeArmazenado: input.nomeArmazenado,
    formato: extension.toLowerCase(),
    tamanhoBytes: input.tamanhoBytes,
    caminho: input.caminho,
    mimetype: input.mimetype,
    status: 'recebido',
    userId: input.userId,
    criadoEm: new Date().toISOString()
  };

  files.unshift(file);
  addLog({ level: 'sucesso', origem: 'files', mensagem: 'Arquivo registrado em modo local.', detalhes: file });
  return file;
}

export function listFiles(userId: string) {
  return files.filter((file) => file.userId === userId);
}
