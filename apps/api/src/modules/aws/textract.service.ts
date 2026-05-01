import { config } from '../../config/config.service.js';

export async function getTextractStatus() {
  if (!config.aws.textractRegion && !config.aws.region) {
    return { configured: false, status: 'not_configured' as const };
  }

  return {
    configured: true,
    status: 'prepared' as const,
    region: config.aws.textractRegion || config.aws.region
  };
}
