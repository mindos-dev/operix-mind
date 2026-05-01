export interface HttpMetric {
  method: string;
  route: string;
  statusCode: number;
  durationMs: number;
  at: string;
}

export interface ObservabilitySnapshot {
  uptimeSeconds: number;
  totalRequests: number;
  totalErrors: number;
  blockedRequests: number;
  aiRequests: number;
  uploadedFiles: number;
  recentRequests: HttpMetric[];
}

const startedAt = Date.now();
const recentRequests: HttpMetric[] = [];

const counters = {
  totalRequests: 0,
  totalErrors: 0,
  blockedRequests: 0,
  aiRequests: 0,
  uploadedFiles: 0
};

export function recordHttpRequest(metric: HttpMetric) {
  counters.totalRequests += 1;
  if (metric.statusCode >= 400) counters.totalErrors += 1;
  if (metric.statusCode === 429 || metric.statusCode === 403) counters.blockedRequests += 1;

  recentRequests.unshift(metric);
  if (recentRequests.length > 50) recentRequests.pop();
}

export function recordAiRequest() {
  counters.aiRequests += 1;
}

export function recordFileUpload() {
  counters.uploadedFiles += 1;
}

export function getObservabilitySnapshot(): ObservabilitySnapshot {
  return {
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    totalRequests: counters.totalRequests,
    totalErrors: counters.totalErrors,
    blockedRequests: counters.blockedRequests,
    aiRequests: counters.aiRequests,
    uploadedFiles: counters.uploadedFiles,
    recentRequests: [...recentRequests]
  };
}
