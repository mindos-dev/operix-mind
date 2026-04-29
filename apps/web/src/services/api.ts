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
}

export interface AuthResult {
  usuario: Usuario;
  token: string;
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

export async function login(email: string, senha: string): Promise<AuthResult> {
  const response = await request<{ dados: AuthResult }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha })
  });
  setAuthToken(response.dados.token);
  return response.dados;
}

export async function me(): Promise<Usuario> {
  const response = await request<{ dados: Usuario }>('/api/auth/me');
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
