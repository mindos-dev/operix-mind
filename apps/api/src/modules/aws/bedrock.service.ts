import { config } from '../../config/config.service.js';

export async function getBedrockStatus() {
  if (!config.aws.bedrockModelId || !config.aws.region) {
    return { configured: false, status: 'not_configured' as const };
  }

  return {
    configured: true,
    status: 'prepared' as const,
    modelId: config.aws.bedrockModelId,
    region: config.aws.region
  };
}
