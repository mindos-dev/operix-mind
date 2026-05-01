import { Router } from 'express';
import { unlink } from 'node:fs/promises';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { uploadSingleFile } from '../../middleware/upload.middleware.js';
import { recordFileUpload } from '../observability/observability.service.js';
import { scanFileForThreats } from '../security/file-security.service.js';
import { createFileRecord, listFiles, persistUploadedFile } from './files.service.js';
export const filesRouter = Router();
filesRouter.use(authMiddleware);
filesRouter.get('/', (req, res) => {
    Promise.resolve(listFiles(req.user.tenantId))
        .then((dados) => res.json({ dados }))
        .catch((error) => res.status(500).json({ mensagem: error instanceof Error ? error.message : 'Erro ao listar arquivos.' }));
});
filesRouter.post('/mock-upload', (req, res) => {
    const nomeOriginal = String(req.body?.nomeOriginal || '').trim();
    const tamanhoBytes = Number(req.body?.tamanhoBytes || 0);
    if (!nomeOriginal || tamanhoBytes <= 0) {
        res.status(400).json({ mensagem: 'Informe nomeOriginal e tamanhoBytes para registrar o arquivo.' });
        return;
    }
    Promise.resolve(createFileRecord({ userId: req.user.id, tenantId: req.user.tenantId, nomeOriginal, tamanhoBytes }))
        .then((dados) => res.status(201).json({ dados }))
        .catch((error) => res.status(400).json({ mensagem: error instanceof Error ? error.message : 'Erro ao registrar arquivo.' }));
});
filesRouter.post('/upload', (req, res) => {
    uploadSingleFile(req, res, (error) => {
        if (error) {
            res.status(400).json({ mensagem: error instanceof Error ? error.message : 'Erro ao enviar arquivo.' });
            return;
        }
        const file = req.file;
        if (!file) {
            res.status(400).json({ mensagem: 'Nenhum arquivo enviado.' });
            return;
        }
        if (scanFileForThreats(file.path)) {
            void unlink(file.path).catch(() => undefined);
            res.status(400).json({ mensagem: 'Arquivo bloqueado pelo scan de segurança.' });
            return;
        }
        Promise.resolve(persistUploadedFile({
            tenantId: req.user.tenantId,
            userId: req.user.id,
            sourcePath: file.path,
            originalName: file.originalname
        })).then((stored) => Promise.resolve(createFileRecord({
            userId: req.user.id,
            tenantId: req.user.tenantId,
            nomeOriginal: file.originalname,
            nomeArmazenado: stored.nomeArmazenado,
            caminho: stored.caminho,
            tamanhoBytes: file.size,
            mimetype: file.mimetype
        }))
            .then((file) => {
            recordFileUpload();
            res.status(201).json({ dados: file });
        }))
            .catch((error) => res.status(400).json({ mensagem: error instanceof Error ? error.message : 'Erro ao registrar arquivo.' }));
    });
});
