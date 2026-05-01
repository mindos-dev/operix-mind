import { config } from '../../config/config.service.js';

export function getAwsConfig() {
  return config.getAwsConfig();
}

export function isAwsConfigured() {
  return Boolean(config.aws.region && config.aws.s3Bucket);
}
