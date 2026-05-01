import { getSecret, setSecret, rotateSecret, validateSecret } from '../security/secrets-manager.service.js';

export const secretsManagerAdapter = {
  getSecret,
  setSecret,
  rotateSecret,
  validateSecret
};
