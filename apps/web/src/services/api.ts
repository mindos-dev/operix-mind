const apiBaseUrl = import.meta.env.VITE_API_URL || '';

export interface AgentInfo {
  nome: string;
  funcao: string;
  modelo: string;
  provedor: string;
  custoEstimadoUsdPor1kTokens: number;
  limiteTokens: number;
  tipoTarefaIdeal: string[];
  ativo: boolean;
}

export interface AiLog {
  etapa: string;
  agente?: string;
  decisao?: string;
  detalhe: string;
  tokensEstimados?: number;
  custoEstimadoUsd?: number;
  criadoEm: string;
}

export interface AiExecutionResult {
  respostaFinal: string;
  logs: AiLog[];
  usoTokens: Array<{
    agentName: string;
    model: string;
    taskType: string;
    tokens: number;
    estimatedCostUsd: number;
  }>;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  plano: string;
  role?: string;
}

export interface AuthResult {
  usuario: Usuario;
  token: string;
  accessToken: string;
  refreshToken: string;
  expiresIn?: string;
}

export type OAuthProvider = 'google' | 'github' | 'azure';

export interface OAuthProviderInfo {
  provider: OAuthProvider;
  label: string;
  enabled: boolean;
  source: 'env' | 'admin';
  updatedAt?: string;
  updatedBy?: string;
  scopes: string[];
}

export interface OAuthStartResult {
  provider: OAuthProvider;
  state: string;
  url: string;
}

export interface OAuthCallbackResult extends AuthResult {
  provider: OAuthProvider;
  status: string;
  message: string;
}

export interface OAuthRuntimeSummary {
  totalProviders: number;
  envEnabled: number;
  adminEnabled: number;
  overridden: number;
  disabled: number;
  lastUpdatedAt?: string;
  providers: Array<{
    provider: OAuthProvider;
    enabled: boolean;
    source: 'env' | 'admin';
    updatedAt?: string;
    updatedBy?: string;
  }>;
}

export interface OAuthDiagnosticsExport {
  generatedAt: string;
  summary: OAuthRuntimeSummary;
  providers: OAuthProviderInfo[];
}

export interface ProjectInfo {
  id: string;
  nome: string;
  descricao: string;
  status: string;
  atualizadoEm: string;
}

export interface FileInfo {
  id: string;
  nomeOriginal: string;
  formato: string;
  tamanhoBytes: number;
  status: string;
  criadoEm: string;
}

export interface DocumentAnalysisResult {
  id: string;
  documentId: string;
  status: 'completed';
  adapter: 'bedrock' | 'local-mock';
  instruction: string;
  summary: string;
  extractedTextPreview: string;
  insights: string[];
  nextActions: string[];
  tokensEstimated: number;
  createdAt: string;
}

export interface ConversionOption {
  id: string;
  origem: string;
  destino: string;
  categoria: string;
  status: string;
  descricao: string;
  engines: string[];
  plugin: string;
  premium?: boolean;
  requerBinarioLocal?: boolean;
  requerCredencial?: boolean;
}

export interface AutomationFlow {
  id: string;
  titulo: string;
  descricao: string;
  entrada: string;
  saida: string;
  usaGemma: boolean;
  premium: boolean;
}

export interface IntegrationInfo {
  id: string;
  nome: string;
  status: string;
  descricao: string;
  credenciais: string[];
  premium?: boolean;
}

export interface TelegramIntegrationInfo {
  id: string;
  userId: string;
  tenantId: string;
  botId: string;
  botUsername: string;
  botName: string;
  status: 'pending' | 'active' | 'disabled' | 'error';
  chatId?: string;
  telegramUserId?: string;
  createdAt: string;
  updatedAt: string;
  connectedAt?: string;
  lastError?: string;
}

export interface TelegramConnectResult {
  integrationId: string;
  botUsername: string;
  botName: string;
  pairingCode: string;
  deepLink: string;
  qrCodeDataUrl: string;
  expiresAt: string;
  status: 'pending' | 'active' | 'disabled' | 'error';
  warning?: string;
}

export interface SetupStatus {
  configured: boolean;
  locked: boolean;
  database: {
    configured: boolean;
    connected: boolean;
  };
  storage: {
    configured: boolean;
    driver: 'local' | 's3';
    status: string;
  };
  aws: {
    configured: boolean;
    status: string;
    region?: string;
    s3Bucket?: string;
    bedrockModelId?: string;
    textractRegion?: string;
  };
  email: {
    configured: boolean;
    status: string;
  };
  telegram: {
    configured: boolean;
    status: string;
  };
}

export interface SetupAdminPayload {
  nome: string;
  email: string;
  senha: string;
  setupToken?: string;
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  status: 'active' | 'revoked';
  expiresAt?: string;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyCreateResult {
  record: ApiKeyInfo;
  apiKey: string;
}

export interface PremiumEstimate {
  status: string;
  cost: {
    modelo: string;
    tipoChamada: string;
    tokensEntrada: number;
    tokensSaida: number;
    custoEstimadoUsd: number;
    limitePlanoUsd: number;
    permitido: boolean;
    aviso?: string;
  };
}

export interface RuntimeDecision {
  runtime: string;
  motivo: string;
  custoEstimadoUsd: number;
  tokensEstimados: number;
  limitePlanoUsd: number;
  risco: string;
  fallback: string;
  modeloSugerido: string;
  classeDispositivo: string;
  complexidade: string;
  bloqueado: boolean;
  mensagem?: string;
}

export interface ConsentRequest {
  scope: string;
  version: string;
  required: boolean;
  message: string;
}

export interface AppLog {
  id: string;
  level: 'info' | 'sucesso' | 'alerta' | 'erro';
  origem: string;
  mensagem: string;
  detalhes?: unknown;
  criadoEm: string;
}

export interface ObservabilityMetric {
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
  recentRequests: ObservabilityMetric[];
}

export interface ConsentRecord {
  userId: string;
  scope: string;
  accepted: boolean;
  acceptedAt: string;
  version: string;
}

export interface UserDataExport {
  user: Usuario | undefined;
  consents: ConsentRecord[];
  files: FileInfo[];
  projects: ProjectInfo[];
  telegramIntegrations?: TelegramIntegrationInfo[];
  exportGeneratedAt: string;
}

let authToken = localStorage.getItem('operix.token') || '';

export function setAuthToken(token: string) {
  authToken = token;
  localStorage.setItem('operix.token', token);
}

export function clearAuthToken() {
  authToken = '';
  localStorage.removeItem('operix.token');
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: 'include',
    headers: {
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...init?.headers
    },
    ...init
  });

  if (!response.ok) {
    throw new Error('A API retornou erro ao processar a solicitação.');
  }

  return response.json() as Promise<T>;
}

async function requestVoid(path: string, init?: RequestInit): Promise<void> {
  const isFormData = init?.body instanceof FormData;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: 'include',
    headers: {
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...init?.headers
    },
    ...init
  });

  if (!response.ok) {
    throw new Error('A API retornou erro ao processar a solicitação.');
  }
}

export async function login(email: string, senha: string): Promise<AuthResult> {
  const response = await request<{ dados: AuthResult }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha })
  });
  setAuthToken(response.dados.accessToken || response.dados.token);
  return response.dados;
}

export async function me(): Promise<Usuario> {
  const response = await request<{ dados: Usuario }>('/api/auth/me');
  return response.dados;
}

export async function fetchOAuthProviders(): Promise<OAuthProviderInfo[]> {
  const response = await request<{ dados: OAuthProviderInfo[] }>('/api/auth/oauth/providers');
  return response.dados;
}

export async function fetchOAuthSummary(): Promise<OAuthRuntimeSummary> {
  const response = await request<{ dados: OAuthRuntimeSummary }>('/api/auth/oauth/summary');
  return response.dados;
}

export async function fetchOAuthDiagnostics(): Promise<OAuthDiagnosticsExport> {
  const response = await request<{ dados: OAuthDiagnosticsExport }>('/api/auth/oauth/export');
  return response.dados;
}

export async function updateOAuthProvider(provider: OAuthProvider, enabled: boolean): Promise<OAuthProviderInfo> {
  const response = await request<{ dados: OAuthProviderInfo }>(`/api/auth/oauth/providers/${provider}`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled })
  });
  return response.dados;
}

export async function resetOAuthProvider(provider: OAuthProvider): Promise<OAuthProviderInfo> {
  const response = await request<{ dados: OAuthProviderInfo }>(`/api/auth/oauth/providers/${provider}/override`, {
    method: 'DELETE'
  });
  return response.dados;
}

export async function resetAllOAuthProviders(): Promise<{ updatedAt: string; updatedBy?: string; providers: OAuthProviderInfo[] }> {
  const response = await request<{ dados: { updatedAt: string; updatedBy?: string; providers: OAuthProviderInfo[] } }>('/api/auth/oauth/reset-all', {
    method: 'POST',
    body: JSON.stringify({ confirmed: true })
  });
  return response.dados;
}

export async function prepareOAuthLogin(provider: OAuthProvider, redirectUri?: string): Promise<OAuthStartResult> {
  const query = redirectUri ? `?redirectUri=${encodeURIComponent(redirectUri)}` : '';
  const response = await request<{ dados: OAuthStartResult }>(`/api/auth/oauth/${provider}/start${query}`);
  return response.dados;
}

export async function completeOAuthLogin(provider: OAuthProvider, query: Record<string, string>): Promise<OAuthCallbackResult> {
  const params = new URLSearchParams(query).toString();
  const response = await request<{ dados: OAuthCallbackResult }>(`/api/auth/oauth/${provider}/callback${params ? `?${params}` : ''}`);
  setAuthToken(response.dados.accessToken || response.dados.token);
  return response.dados;
}

export async function fetchAgents(): Promise<AgentInfo[]> {
  const response = await request<{ dados: AgentInfo[] }>('/api/ai/agents');
  return response.dados;
}

export async function executeAi(mensagem: string): Promise<AiExecutionResult> {
  const response = await request<{ dados: AiExecutionResult }>('/api/ai/execute', {
    method: 'POST',
    body: JSON.stringify({ mensagem })
  });
  return response.dados;
}

export async function fetchProjects(): Promise<ProjectInfo[]> {
  const response = await request<{ dados: ProjectInfo[] }>('/api/projects');
  return response.dados;
}

export async function createProject(nome: string, descricao: string): Promise<ProjectInfo> {
  const response = await request<{ dados: ProjectInfo }>('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ nome, descricao })
  });
  return response.dados;
}

export async function fetchFiles(): Promise<FileInfo[]> {
  const response = await request<{ dados: FileInfo[] }>('/api/files');
  return response.dados;
}

export async function createMockFile(nomeOriginal: string, tamanhoBytes: number): Promise<FileInfo> {
  const response = await request<{ dados: FileInfo }>('/api/files/mock-upload', {
    method: 'POST',
    body: JSON.stringify({ nomeOriginal, tamanhoBytes })
  });
  return response.dados;
}

export async function uploadFile(file: File): Promise<FileInfo> {
  const data = new FormData();
  data.append('arquivo', file);

  const response = await request<{ dados: FileInfo }>('/api/files/upload', {
    method: 'POST',
    body: data
  });
  return response.dados;
}

export async function uploadDocument(file: File): Promise<FileInfo> {
  const data = new FormData();
  data.append('arquivo', file);

  const response = await request<{ dados: FileInfo }>('/documents/upload', {
    method: 'POST',
    body: data
  });
  return response.dados;
}

export async function fetchDocuments(): Promise<FileInfo[]> {
  const response = await request<{ dados: FileInfo[] }>('/documents');
  return response.dados;
}

export async function fetchDocument(documentId: string): Promise<FileInfo> {
  const response = await request<{ dados: FileInfo }>(`/documents/${documentId}`);
  return response.dados;
}

export async function analyzeDocument(documentId: string, instruction: string): Promise<DocumentAnalysisResult> {
  const response = await request<{ dados: DocumentAnalysisResult }>('/ai/analyze-document', {
    method: 'POST',
    body: JSON.stringify({ documentId, instruction })
  });
  return response.dados;
}

export async function fetchDocumentResult(documentId: string): Promise<DocumentAnalysisResult> {
  const response = await request<{ dados: DocumentAnalysisResult }>(`/documents/${documentId}/result`);
  return response.dados;
}

export async function fetchConversionOptions(): Promise<ConversionOption[]> {
  const response = await request<{ dados: ConversionOption[] }>('/api/conversions/options');
  return response.dados;
}

export async function fetchAutomationFlows(): Promise<AutomationFlow[]> {
  const response = await request<{ dados: AutomationFlow[] }>('/api/automations/flows');
  return response.dados;
}

export async function runAutomation(flowId: string, texto: string) {
  const response = await request<{ dados: unknown }>('/api/automations/run', {
    method: 'POST',
    body: JSON.stringify({ flowId, texto })
  });
  return response.dados;
}

export async function fetchIntegrations(): Promise<IntegrationInfo[]> {
  const response = await request<{ dados: IntegrationInfo[] }>('/api/integrations');
  return response.dados;
}

export async function fetchTelegramIntegrations(): Promise<TelegramIntegrationInfo[]> {
  const response = await request<{ dados: TelegramIntegrationInfo[] }>('/api/integrations/telegram/status');
  return response.dados;
}

export async function connectTelegramBot(botToken: string): Promise<TelegramConnectResult> {
  const response = await request<{ dados: TelegramConnectResult }>('/api/integrations/telegram/connect', {
    method: 'POST',
    body: JSON.stringify({ botToken })
  });
  return response.dados;
}

export async function refreshTelegramPairing(integrationId: string): Promise<TelegramConnectResult> {
  const response = await request<{ dados: TelegramConnectResult }>(`/api/integrations/telegram/${integrationId}/refresh-pairing`, {
    method: 'POST'
  });
  return response.dados;
}

export async function disableTelegramIntegration(integrationId: string): Promise<TelegramIntegrationInfo> {
  const response = await request<{ dados: TelegramIntegrationInfo }>(`/api/integrations/telegram/${integrationId}/disable`, {
    method: 'POST'
  });
  return response.dados;
}

export async function removeTelegramIntegration(integrationId: string): Promise<void> {
  await requestVoid(`/api/integrations/telegram/${integrationId}`, { method: 'DELETE' });
}

export async function testTelegramIntegration(integrationId: string): Promise<{ ok: boolean }> {
  const response = await request<{ dados: { ok: boolean } }>(`/api/integrations/telegram/${integrationId}/test`, {
    method: 'POST'
  });
  return response.dados;
}

export async function fetchConsentRequest(scope: string): Promise<ConsentRequest> {
  const response = await request<{ dados: ConsentRequest }>(`/api/privacy/consent/${scope}`);
  return response.dados;
}

export async function fetchObservabilityMetrics(): Promise<ObservabilitySnapshot> {
  const response = await request<{ dados: ObservabilitySnapshot }>('/api/observability/metrics');
  return response.dados;
}

export async function fetchSetupStatus(): Promise<SetupStatus> {
  const response = await request<{ dados: SetupStatus }>('/api/setup/status');
  return response.dados;
}

export async function createSetupAdmin(payload: SetupAdminPayload) {
  const response = await request<{ dados: AuthResult }>('/api/setup/admin', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  setAuthToken(response.dados.accessToken || response.dados.token);
  return response.dados;
}

export async function validateSetupDatabase() {
  const response = await request<{ dados: unknown }>('/api/setup/validate-database', { method: 'POST' });
  return response.dados;
}

export async function validateSetupStorage() {
  const response = await request<{ dados: unknown }>('/api/setup/validate-storage', { method: 'POST' });
  return response.dados;
}

export async function validateSetupAws() {
  const response = await request<{ dados: unknown }>('/api/setup/validate-aws', { method: 'POST' });
  return response.dados;
}

export async function validateSetupEmail() {
  const response = await request<{ dados: unknown }>('/api/setup/validate-email', { method: 'POST' });
  return response.dados;
}

export async function fetchApiKeys(): Promise<ApiKeyInfo[]> {
  const response = await request<{ dados: ApiKeyInfo[] }>('/api/api-keys');
  return response.dados;
}

export async function createApiKey(name: string, scopes: string[] = [], expiresAt?: string): Promise<ApiKeyCreateResult> {
  const response = await request<{ dados: ApiKeyCreateResult }>('/api/api-keys', {
    method: 'POST',
    body: JSON.stringify({ name, scopes, expiresAt })
  });
  return response.dados;
}

export async function rotateApiKey(apiKeyId: string): Promise<ApiKeyCreateResult> {
  const response = await request<{ dados: ApiKeyCreateResult }>(`/api/api-keys/${apiKeyId}/rotate`, {
    method: 'POST'
  });
  return response.dados;
}

export async function revokeApiKey(apiKeyId: string): Promise<ApiKeyInfo> {
  const response = await request<{ dados: ApiKeyInfo }>(`/api/api-keys/${apiKeyId}`, {
    method: 'DELETE'
  });
  return response.dados;
}

export async function fetchLogs(): Promise<AppLog[]> {
  const response = await request<{ dados: AppLog[] }>('/api/logs');
  return response.dados;
}

export async function registerConsent(scope: string, accepted: boolean, version = '1.0'): Promise<ConsentRecord> {
  const response = await request<{ dados: ConsentRecord }>('/api/privacy/consent', {
    method: 'POST',
    body: JSON.stringify({ scope, accepted, version })
  });
  return response.dados;
}

export async function exportUserData(): Promise<UserDataExport> {
  const response = await request<{ dados: UserDataExport }>('/api/privacy/export');
  return response.dados;
}

export async function deleteUserData(): Promise<void> {
  await requestVoid('/api/privacy/delete', { method: 'DELETE' });
}

export async function estimatePremium(prompt: string): Promise<PremiumEstimate> {
  const response = await request<{ dados: PremiumEstimate }>('/api/ai/premium/estimate', {
    method: 'POST',
    body: JSON.stringify({ prompt })
  });
  return response.dados;
}

export async function decideRuntime(prompt: string, tipo: string, modoEconomia: boolean): Promise<RuntimeDecision> {
  const nav = navigator as Navigator & { deviceMemory?: number; userAgentData?: { platform?: string; mobile?: boolean } };
  const device = {
    tipoDispositivo: nav.userAgentData?.mobile ? 'mobile' : 'desktop',
    memoriaGb: nav.deviceMemory || 0,
    navegador: navigator.userAgent,
    sistemaOperacional: nav.userAgentData?.platform || navigator.platform,
    suportaWebGPU: 'gpu' in navigator,
    suportaWasm: typeof WebAssembly !== 'undefined',
    modoEconomia
  };

  const response = await request<{ dados: RuntimeDecision }>('/api/ai/runtime/decide', {
    method: 'POST',
    body: JSON.stringify({ prompt, tipo, device })
  });
  return response.dados;
}
