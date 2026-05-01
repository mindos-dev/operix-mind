import { Router, type RequestHandler } from 'express';
import { unlink } from 'node:fs/promises';
import { z } from 'zod';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { uploadSingleFile } from '../../middleware/upload.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { recordFileUpload } from '../observability/observability.service.js';
import { scanFileForThreats } from '../security/file-security.service.js';
import { createFileRecord, persistUploadedFile } from '../files/files.service.js';
import { analyzeDocument, getDocument, getDocumentResult, isAcceptedDocumentFormat, listDocuments } from './documents.service.js';

export const documentsRouter = Router();

documentsRouter.use(authMiddleware);

documentsRouter.get('/', async (req, res, next) => {
  try {
    res.json({ dados: await listDocuments(req.user!.tenantId) });
  } catch (error) {
    next(error);
  }
});

documentsRouter.get('/:id', async (req, res, next) => {
  try {
    const document = await getDocument(req.user!.tenantId, req.params.id);
    if (!document) {
      res.status(404).json({ mensagem: 'Documento não encontrado.' });
      return;
    }
    res.json({ dados: document });
  } catch (error) {
    next(error);
  }
});

documentsRouter.get('/:id/result', async (req, res, next) => {
  try {
    const result = await getDocumentResult(req.user!.tenantId, req.params.id);
    if (!result) {
      res.status(404).json({ mensagem: 'Resultado não encontrado.' });
      return;
    }
    res.json({ dados: result });
  } catch (error) {
    next(error);
  }
});

documentsRouter.post('/upload', (req, res) => {
  uploadSingleFile(req, res, (error) => {
    if (error) {
      res.status(400).json({ mensagem: error instanceof Error ? error.message : 'Erro ao enviar documento.' });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ mensagem: 'Nenhum documento enviado.' });
      return;
    }

    if (!isAcceptedDocumentFormat(file.originalname)) {
      void unlink(file.path).catch(() => undefined);
      res.status(400).json({ mensagem: 'Formato de documento não permitido.' });
      return;
    }

    if (scanFileForThreats(file.path)) {
      void unlink(file.path).catch(() => undefined);
      res.status(400).json({ mensagem: 'Documento bloqueado pelo scan de segurança.' });
      return;
    }

    Promise.resolve(persistUploadedFile({
      tenantId: req.user!.tenantId,
      userId: req.user!.id,
      sourcePath: file.path,
      originalName: file.originalname
    })).then((stored) => Promise.resolve(createFileRecord({
      userId: req.user!.id,
      tenantId: req.user!.tenantId,
      nomeOriginal: file.originalname,
      nomeArmazenado: stored.nomeArmazenado,
      caminho: stored.caminho,
      tamanhoBytes: file.size,
      mimetype: file.mimetype
    }))
      .then((document) => {
        recordFileUpload();
        res.status(201).json({ dados: document });
      }))
      .catch((uploadError) => res.status(400).json({ mensagem: uploadError instanceof Error ? uploadError.message : 'Erro ao registrar documento.' }));
  });
});

export const analyzeDocumentBodySchema = z.object({
  documentId: z.string().trim().min(1),
  instruction: z.string().trim().min(1).max(4000).default('Analise o documento e gere um resumo executivo.')
});

const analyzeDocumentHandler: RequestHandler = async (req, res, next) => {
  try {
    const result = await analyzeDocument({
      tenantId: req.user!.tenantId,
      userId: req.user!.id,
      documentId: req.body.documentId,
      instruction: req.body.instruction
    });
    res.json({ dados: result });
  } catch (error) {
    if (error instanceof Error && error.message.includes('não encontrado')) {
      res.status(404).json({ mensagem: error.message });
      return;
    }
    next(error);
  }
};

export const analyzeDocumentRoute = [
  authMiddleware,
  validateBody(analyzeDocumentBodySchema),
  analyzeDocumentHandler
] as const;
