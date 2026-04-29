import { Router } from 'express';
import { unlink } from 'node:fs/promises';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { uploadSingleFile } from '../../middleware/upload.middleware.js';
import { scanFileForThreats } from '../security/file-security.service.js';
import { createFileRecord, listFiles } from './files.service.js';

export const filesRouter = Router();

filesRouter.use(authMiddleware);

filesRouter.get('/', (req, res) => {
  res.json({ dados: listFiles(req.user!.id) });
});

filesRouter.post('/mock-upload', (req, res) => {
  const nomeOriginal = String(req.body?.nomeOriginal || '').trim();
  const tamanhoBytes = Number(req.body?.tamanhoBytes || 0);

  if (!nomeOriginal || tamanhoBytes <= 0) {
    res.status(400).json({ mensagem: 'Informe nomeOriginal e tamanhoBytes para registrar o arquivo.' });
    return;
  }

  res.status(201).json({ dados: createFileRecord({ userId: req.user!.id, nomeOriginal, tamanhoBytes }) });
});

filesRouter.post('/upload', (req, res) => {
  uploadSingleFile(req, res, (error) => {
    if (error) {
      res.status(400).json({ mensagem: error instanceof Error ? error.message : 'Erro ao enviar arquivo.' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ mensagem: 'Nenhum arquivo enviado.' });
      return;
    }

    if (scanFileForThreats(req.file.path)) {
      void unlink(req.file.path).catch(() => undefined);
      res.status(400).json({ mensagem: 'Arquivo bloqueado pelo scan de segurança.' });
      return;
    }

    const file = createFileRecord({
      userId: req.user!.id,
      nomeOriginal: req.file.originalname,
      nomeArmazenado: req.file.filename,
      caminho: req.file.path,
      tamanhoBytes: req.file.size,
      mimetype: req.file.mimetype
    });

    res.status(201).json({ dados: file });
  });
});
