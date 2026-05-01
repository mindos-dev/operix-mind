import { config } from '../../config/config.service.js';
import { exists } from '../storage/storage.service.js';

export async function getAwsHealth() {
  const configured = Boolean(config.aws.region && config.aws.s3Bucket);
  if (!configured) {
    return {
      configured: false,
      status: 'not_configured'
    };
  }

  const storageHealthy = await exists(`s3://${config.aws.s3Bucket}/health-check-probe`).catch(() => false);
  return {
    configured: true,
    status: storageHealthy ? 'connected' : 'degraded',
    region: config.aws.region,
    s3Bucket: config.aws.s3Bucket,
    bedrockModelId: config.aws.bedrockModelId || '',
    textractRegion: config.aws.textractRegion || config.aws.region
  };
}
