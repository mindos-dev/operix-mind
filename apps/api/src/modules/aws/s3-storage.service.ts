import { deleteFile, exists, getFile, getSignedUrlForFile, listStoredFiles, migrateLocalToS3, saveFile } from '../storage/storage.service.js';

export const s3StorageService = {
  saveFile,
  deleteFile,
  exists,
  getFile,
  getSignedUrlForFile,
  listStoredFiles,
  migrateLocalToS3
};
