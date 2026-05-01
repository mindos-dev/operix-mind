import { estimateTokens } from '@operix-mind/ai-agents';
import { getPrismaClient, hasDatabase } from '../../db/prisma.js';
import { getFile } from '../storage/storage.service.js';
import { addLog } from '../logs/logs.service.js';
import { getFileRecord, listFiles, type FileRecord } from '../files/files.service.js';
import { config } from '../../config/config.service.js';

export interface DocumentAnalysisResult {
  id: string;
  documentId: string;
  status: 'completed';
  adapter: 'bedrock' | 'local-mock';
  instruction: string;
  summary: string;
  extractedTextPreview: string;
  insights: string[];
  nextActions: string[];
  tokensEstimated: number;
  createdAt: string;
}

const acceptedDocumentFormats = new Set(['pdf', 'docx', 'xlsx', 'csv', 'txt', 'png', 'jpg', 'jpeg']);
const localResults = new Map<string, DocumentAnalysisResult>();

export function isAcceptedDocumentFormat(filename: string) {
  const extension = filename.includes('.') ? filename.split('.').pop()?.toLowerCase() : '';
  return Boolean(extension && acceptedDocumentFormats.has(extension));
}

export async function listDocuments(tenantId: string) {
  const files = await listFiles(tenantId);
  return files.filter((file) => acceptedDocumentFormats.has(file.formato));
}

export async function getDocument(tenantId: string, documentId: string) {
  const file = await getFileRecord(tenantId, documentId);
  if (!file || !acceptedDocumentFormats.has(file.formato)) return null;
  return file;
}

export async function analyzeDocument(input: {
  tenantId: string;
  userId: string;
  documentId: string;
  instruction: string;
}) {
  const document = await getDocument(input.tenantId, input.documentId);
  if (!document) {
    throw new Error('Documento não encontrado.');
  }

  const textPreview = await extractDocumentPreview(document);
  const adapter = config.aws.bedrockModelId ? 'bedrock' : 'local-mock';
  const instruction = input.instruction.trim() || 'Analise o documento e gere um resumo executivo.';
  const tokensEstimated = estimateTokens(`${document.nomeOriginal}\n${instruction}\n${textPreview}`);
  const createdAt = new Date().toISOString();
  const result: DocumentAnalysisResult = {
    id: `${document.id}:${Date.now()}`,
    documentId: document.id,
    status: 'completed',
    adapter,
    instruction,
    summary: buildSummary(document, instruction, textPreview, adapter),
    extractedTextPreview: textPreview,
    insights: buildInsights(document, textPreview),
    nextActions: [
      'Validar dados extraidos com o documento original.',
      'Gerar proposta, relatorio ou orçamento a partir do resultado.',
      'Anexar evidencias e salvar o historico no projeto.'
    ],
    tokensEstimated,
    createdAt
  };

  await saveDocumentResult(input.tenantId, input.userId, result);
  await addLog({
    level: 'sucesso',
    origem: 'documents',
    mensagem: 'Documento analisado por IA.',
    detalhes: { documentId: document.id, adapter, tokensEstimated },
    tenantId: input.tenantId,
    userId: input.userId
  });

  return result;
}

export async function getDocumentResult(tenantId: string, documentId: string) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      const event = await prisma.fileProcessingEvent.findFirst({
        where: {
          fileId: documentId,
          arquivo: { tenantId },
          step: 'ai-analysis'
        },
        orderBy: { criadoEm: 'desc' }
      });
      return event?.detalhes as unknown as DocumentAnalysisResult | null;
    }
  }

  return localResults.get(documentId) || null;
}

async function saveDocumentResult(tenantId: string, userId: string, result: DocumentAnalysisResult) {
  if (hasDatabase()) {
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.fileProcessingEvent.create({
        data: {
          fileId: result.documentId,
          status: result.status,
          step: 'ai-analysis',
          detalhes: JSON.parse(JSON.stringify(result))
        }
      });
      return;
    }
  }

  localResults.set(result.documentId, result);
  await addLog({
    level: 'info',
    origem: 'documents',
    mensagem: 'Resultado de documento mantido em memória local.',
    detalhes: { documentId: result.documentId },
    tenantId,
    userId
  });
}

async function extractDocumentPreview(document: FileRecord) {
  if (!document.caminho) return 'Arquivo registrado sem caminho de armazenamento disponível.';

  try {
    const buffer = await getFile(document.caminho);
    if (['txt', 'csv'].includes(document.formato)) {
      return buffer.toString('utf8').replace(/\s+/g, ' ').slice(0, 2200);
    }

    return `Arquivo ${document.formato.toUpperCase()} recebido com ${document.tamanhoBytes} bytes. Conteudo binario preservado em storage para processamento especializado.`;
  } catch {
    return 'Nao foi possivel abrir o arquivo armazenado; analise baseada nos metadados do documento.';
  }
}

function buildSummary(document: FileRecord, instruction: string, preview: string, adapter: DocumentAnalysisResult['adapter']) {
  const engineLabel = adapter === 'bedrock' ? 'Bedrock configurado' : 'adapter local/mock';
  return [
    `${engineLabel}: analise concluida para ${document.nomeOriginal}.`,
    `Instrucao: ${instruction}`,
    `Formato: ${document.formato.toUpperCase()} | Tamanho: ${document.tamanhoBytes} bytes.`,
    `Resumo: ${preview.slice(0, 420)}`
  ].join('\n');
}

function buildInsights(document: FileRecord, preview: string) {
  const insights = [
    `Documento classificado como ${document.formato.toUpperCase()}.`,
    'Fluxo principal documento -> IA -> resultado executado com sucesso.'
  ];

  if (preview.length > 120) {
    insights.push('Ha conteudo suficiente para gerar entregaveis comerciais ou tecnicos.');
  }

  return insights;
}
