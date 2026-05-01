import { StrictMode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  clearAuthToken,
  createProject,
  createSetupAdmin,
  decideRuntime,
  deleteUserData,
  fetchApiKeys,
  createApiKey,
  exportUserData,
  estimatePremium,
  executeAi,
  fetchAgents,
  fetchAutomationFlows,
  fetchConsentRequest,
  fetchConversionOptions,
  fetchFiles,
  fetchDocuments,
  fetchIntegrations,
  fetchTelegramIntegrations,
  fetchSetupStatus,
  connectTelegramBot,
  refreshTelegramPairing,
  disableTelegramIntegration,
  removeTelegramIntegration,
  testTelegramIntegration,
  fetchOAuthProviders,
  fetchLogs,
  fetchObservabilityMetrics,
  fetchProjects,
  completeOAuthLogin,
  fetchOAuthDiagnostics,
  fetchOAuthSummary,
  prepareOAuthLogin,
  updateOAuthProvider,
  resetOAuthProvider,
  resetAllOAuthProviders,
  login,
  me,
  registerConsent,
  runAutomation,
  rotateApiKey,
  revokeApiKey,
  analyzeDocument,
  uploadDocument,
  validateSetupAws,
  validateSetupDatabase,
  validateSetupEmail,
  validateSetupStorage,
  uploadFile,
  type AgentInfo,
  type AiExecutionResult,
  type AiLog,
  type AutomationFlow,
  type ConsentRequest,
  type AppLog,
  type ConversionOption,
  type FileInfo,
  type DocumentAnalysisResult,
  type IntegrationInfo,
  type TelegramIntegrationInfo,
  type TelegramConnectResult,
  type PremiumEstimate,
  type ProjectInfo,
  type OAuthProviderInfo,
  type OAuthProvider,
  type OAuthDiagnosticsExport,
  type OAuthRuntimeSummary,
  type ObservabilitySnapshot,
  type RuntimeDecision,
  type SetupStatus,
  type ApiKeyInfo,
  type UserDataExport,
  type Usuario
} from './services/api.js';
import './styles/global.css';

type ThemeMode = 'dark' | 'light';
type ThemeContextValue = {
  theme: ThemeMode;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const toolbarItems = ['Arquivos', 'Conversão', 'Executar', 'Debugar', 'IAs', 'Integrações', 'Ferramentas', 'Configurações', 'Tema', 'Upload', 'Download', 'Relatórios', 'Propostas', 'Dashboards', 'Automação'];
const sidebarItems = ['Novo Chat', 'Buscar por projetos', 'Projetos', 'Modo Codex', 'IAs', 'Debug & Logs', 'Integrações', 'Conversões', 'Automações', 'Relatórios', 'Propostas', 'Dashboards', 'Mais recentes'];
const categoryLabels: Record<string, string> = {
  documentos: 'Documentos',
  pdf_avancado: 'PDF avançado',
  planilhas: 'Planilhas',
  imagens: 'Imagens',
  cad_engenharia: 'CAD / Engenharia',
  eletronica_gerber: 'Eletrônica / Gerber',
  midia: 'Áudio e vídeo'
};

function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [documents, setDocuments] = useState<FileInfo[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<FileInfo | null>(null);
  const [documentInstruction, setDocumentInstruction] = useState('Analise este documento e gere um resultado executivo vendável.');
  const [documentResult, setDocumentResult] = useState<DocumentAnalysisResult | null>(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [conversions, setConversions] = useState<ConversionOption[]>([]);
  const [automations, setAutomations] = useState<AutomationFlow[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationInfo[]>([]);
  const [telegramIntegrations, setTelegramIntegrations] = useState<TelegramIntegrationInfo[]>([]);
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramConnectResult, setTelegramConnectResult] = useState<TelegramConnectResult | null>(null);
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([]);
  const [apiKeyName, setApiKeyName] = useState('CLI local');
  const [apiKeyScopes, setApiKeyScopes] = useState('projects:read,projects:write');
  const [setupAdminName, setSetupAdminName] = useState('Admin Mind_IA');
  const [setupAdminEmail, setSetupAdminEmail] = useState('admin@mind.local');
  const [setupAdminPassword, setSetupAdminPassword] = useState('MindAdmin123!');
  const [setupAdminToken, setSetupAdminToken] = useState('');
  const [oauthProviders, setOauthProviders] = useState<OAuthProviderInfo[]>([]);
  const [oauthSummary, setOauthSummary] = useState<OAuthRuntimeSummary | null>(null);
  const [oauthDiagnostics, setOauthDiagnostics] = useState<OAuthDiagnosticsExport | null>(null);
  const [premiumEstimate, setPremiumEstimate] = useState<PremiumEstimate | null>(null);
  const [runtimeDecision, setRuntimeDecision] = useState<RuntimeDecision | null>(null);
  const [observability, setObservability] = useState<ObservabilitySnapshot | null>(null);
  const [securityLogs, setSecurityLogs] = useState<AppLog[]>([]);
  const [consentScope, setConsentScope] = useState('processing');
  const [consentRequest, setConsentRequest] = useState<ConsentRequest | null>(null);
  const [privacyExport, setPrivacyExport] = useState<UserDataExport | null>(null);
  const [prompt, setPrompt] = useState('crie um sistema de orçamento');
  const [commandMode, setCommandMode] = useState('orçamento');
  const [activeView, setActiveView] = useState<'console' | 'projeto'>('console');
  const [result, setResult] = useState<AiExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [oauthProcessing, setOauthProcessing] = useState(false);

  useEffect(() => {
    fetchAgents().then(setAgents).catch(() => setError('Não foi possível carregar os agentes. Verifique se a API está rodando.'));
    fetchOAuthProviders().then(setOauthProviders).catch(() => setOauthProviders([]));
    fetchOAuthSummary().then(setOauthSummary).catch(() => setOauthSummary(null));
    fetchOAuthDiagnostics().then(setOauthDiagnostics).catch(() => setOauthDiagnostics(null));

    const location = window.location;
    if (location.pathname === '/oauth/callback') {
      const params = new URLSearchParams(location.search);
      const provider = params.get('provider') as OAuthProvider | null;
      if (provider) {
        setOauthProcessing(true);
        completeOAuthLogin(provider, Object.fromEntries(params.entries()) as Record<string, string>)
          .then(async (auth) => {
            setUsuario(auth.usuario);
            await loadWorkspace();
            window.history.replaceState({}, '', '/');
          })
          .catch(() => {
            setError('Não foi possível concluir o login SSO.');
          })
          .finally(() => {
            setOauthProcessing(false);
          });
      }
    }

    me().then(async (user) => {
      setUsuario(user);
      await loadWorkspace();
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!usuario) return;

    fetchConsentRequest(consentScope).then(setConsentRequest).catch(() => setConsentRequest(null));
  }, [consentScope, usuario]);

  useEffect(() => {
    if (!usuario) return;

    Promise.all([
      fetchObservabilityMetrics(),
      fetchLogs()
    ]).then(([metrics, logs]) => {
      setObservability(metrics);
      setSecurityLogs(logs);
    }).catch(() => {
      setObservability(null);
      setSecurityLogs([]);
    });
  }, [usuario]);

  const totalCost = useMemo(() => {
    if (!result) return '0.000000';
    return result.usoTokens.reduce((sum, usage) => sum + usage.estimatedCostUsd, 0).toFixed(6);
  }, [result]);

  const conversionsByCategory = useMemo(() => {
    return conversions.reduce<Record<string, ConversionOption[]>>((groups, option) => {
      groups[option.categoria] = [...(groups[option.categoria] || []), option];
      return groups;
    }, {});
  }, [conversions]);

  async function loadWorkspace() {
    const [projectData, fileData, documentData, conversionData, automationData, integrationData, telegramData, setupData, apiKeyData] = await Promise.all([
      fetchProjects(),
      fetchFiles(),
      fetchDocuments().catch(() => []),
      fetchConversionOptions(),
      fetchAutomationFlows(),
      fetchIntegrations(),
      fetchTelegramIntegrations(),
      fetchSetupStatus().catch(() => null),
      fetchApiKeys().catch(() => [])
    ]);
    setProjects(projectData);
    setFiles(fileData);
    setDocuments(documentData);
    setConversions(conversionData);
    setAutomations(automationData);
    setIntegrations(integrationData);
    setTelegramIntegrations(telegramData);
    setSetupStatus(setupData);
    setApiKeys(apiKeyData);
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthLoading(true);
    setError('');
    const form = new FormData(event.currentTarget);

    try {
      const auth = await login(String(form.get('email') || ''), String(form.get('senha') || ''));
      setUsuario(auth.usuario);
      await loadWorkspace();
    } catch (_error) {
      setError('Não foi possível autenticar. Use demo@operix.local / operix123.');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleTelegramConnect() {
    if (!telegramBotToken.trim()) {
      setError('Informe o token do bot Telegram.');
      return;
    }

    try {
      setLoading(true);
      const result = await connectTelegramBot(telegramBotToken.trim());
      setTelegramConnectResult(result);
      setTelegramBotToken('');
      await loadWorkspace();
    } catch (_error) {
      setError('Não foi possível conectar o bot Telegram.');
    } finally {
      setLoading(false);
    }
  }

  async function handleTelegramRefreshPairing() {
    if (!telegramConnectResult) return;
    try {
      const updated = await refreshTelegramPairing(telegramConnectResult.integrationId);
      setTelegramConnectResult((current) => current ? { ...current, ...updated } : current);
      await loadWorkspace();
    } catch (_error) {
      setError('Não foi possível renovar o pareamento.');
    }
  }

  async function handleTelegramDisable(integrationId: string) {
    try {
      await disableTelegramIntegration(integrationId);
      await loadWorkspace();
    } catch (_error) {
      setError('Não foi possível desativar a integração.');
    }
  }

  async function handleTelegramRemove(integrationId: string) {
    try {
      await removeTelegramIntegration(integrationId);
      await loadWorkspace();
      setTelegramConnectResult(null);
    } catch (_error) {
      setError('Não foi possível remover a integração.');
    }
  }

  async function handleTelegramTest(integrationId: string) {
    try {
      await testTelegramIntegration(integrationId);
    } catch (_error) {
      setError('Não foi possível enviar o teste Telegram.');
    }
  }

  async function handleCreateApiKey() {
    if (!apiKeyName.trim()) {
      setError('Informe um nome para a API key.');
      return;
    }

    try {
      const result = await createApiKey(apiKeyName.trim(), apiKeyScopes.split(',').map((scope) => scope.trim()).filter(Boolean));
      setApiKeys((current) => [result.record, ...current]);
      setError(`API key criada: ${result.apiKey}`);
    } catch (_error) {
      setError('Não foi possível criar a API key.');
    }
  }

  async function handleRevokeApiKey(apiKeyId: string) {
    try {
      const revoked = await revokeApiKey(apiKeyId);
      setApiKeys((current) => current.map((item) => (item.id === revoked.id ? revoked : item)));
    } catch (_error) {
      setError('Não foi possível revogar a API key.');
    }
  }

  async function handleRotateApiKey(apiKeyId: string) {
    try {
      const rotated = await rotateApiKey(apiKeyId);
      setApiKeys((current) => [rotated.record, ...current.filter((item) => item.id !== apiKeyId)]);
      setError(`API key rotacionada: ${rotated.apiKey}`);
    } catch (_error) {
      setError('Não foi possível rotacionar a API key.');
    }
  }

  async function handleSetupCreateAdmin() {
    try {
      const auth = await createSetupAdmin({
        nome: setupAdminName.trim(),
        email: setupAdminEmail.trim(),
        senha: setupAdminPassword,
        setupToken: setupAdminToken.trim() || undefined
      });
      setUsuario(auth.usuario);
      await loadWorkspace();
      setError('Admin inicial criado com sucesso.');
    } catch (_error) {
      setError('Não foi possível criar o admin inicial.');
    }
  }

  async function handleSetupValidation(action: 'database' | 'storage' | 'aws' | 'email') {
    try {
      if (action === 'database') await validateSetupDatabase();
      if (action === 'storage') await validateSetupStorage();
      if (action === 'aws') await validateSetupAws();
      if (action === 'email') await validateSetupEmail();
      await loadWorkspace();
    } catch (_error) {
      setError(`Não foi possível validar ${action}.`);
    }
  }

  async function handleOAuthLogin(provider: OAuthProviderInfo['provider']) {
    setAuthLoading(true);
    setError('');

    try {
      const redirectUri = `${window.location.origin}/oauth/callback`;
      const prepared = await prepareOAuthLogin(provider, redirectUri);
      window.location.href = prepared.url;
    } catch (_error) {
      setError('Não foi possível iniciar o login OAuth.');
      setAuthLoading(false);
    }
  }

  async function handleToggleOAuthProvider(provider: OAuthProviderInfo['provider'], enabled: boolean) {
    try {
      const updated = await updateOAuthProvider(provider, enabled);
      setOauthProviders((current) => current.map((item) => item.provider === provider ? updated : item));
      await reloadOAuthAdminState();
    } catch (_error) {
      setError('Não foi possível atualizar o provedor OAuth.');
    }
  }

  async function handleResetOAuthProvider(provider: OAuthProviderInfo['provider']) {
    try {
      const updated = await resetOAuthProvider(provider);
      setOauthProviders((current) => current.map((item) => item.provider === provider ? updated : item));
      await reloadOAuthAdminState();
    } catch (_error) {
      setError('Não foi possível restaurar o provedor OAuth.');
    }
  }

  async function handleResetAllOAuthProviders() {
    try {
      const result = await resetAllOAuthProviders();
      setOauthProviders((current) => current.map((item) => {
        const matched = result.providers.find((provider) => provider.provider === item.provider);
        return matched ? matched : item;
      }));
      await reloadOAuthAdminState();
    } catch (_error) {
      setError('Não foi possível restaurar todos os provedores OAuth.');
    }
  }

  async function handleRefreshOAuthDiagnostics() {
    await reloadOAuthAdminState();
  }

  async function reloadOAuthAdminState() {
    try {
      const [summary, diagnostics] = await Promise.all([
        fetchOAuthSummary(),
        fetchOAuthDiagnostics()
      ]);
      setOauthSummary(summary);
      setOauthDiagnostics(diagnostics);
      setOauthProviders(diagnostics.providers);
    } catch (_error) {
      setError('Não foi possível atualizar o diagnóstico OAuth.');
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const [data, estimate, runtime] = await Promise.all([
        executeAi(prompt),
        estimatePremium(prompt),
        decideRuntime(prompt, commandMode, true)
      ]);
      setResult(data);
      setPremiumEstimate(estimate);
      setRuntimeDecision(runtime);
    } catch (_error) {
      setError('Erro ao executar o fluxo de IA. Confira a API e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProject() {
    const project = await createProject('Novo projeto Mind_IA', 'Projeto criado pela interface local.');
    setProjects((current) => [project, ...current]);
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    try {
      const file = await uploadFile(selectedFile);
      setFiles((current) => [file, ...current]);
      event.target.value = '';
    } catch (_error) {
      setError('Não foi possível enviar o arquivo. Verifique formato e tamanho.');
    }
  }

  async function handleDocumentUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    try {
      setDocumentLoading(true);
      setError('');
      const document = await uploadDocument(selectedFile);
      setDocuments((current) => [document, ...current.filter((item) => item.id !== document.id)]);
      setSelectedDocument(document);
      setDocumentResult(null);
      event.target.value = '';
    } catch (_error) {
      setError('Não foi possível enviar o documento. Use pdf, docx, xlsx, csv, txt, png ou jpg.');
    } finally {
      setDocumentLoading(false);
    }
  }

  async function handleDocumentAnalyze() {
    if (!selectedDocument) {
      setError('Envie ou selecione um documento antes de analisar.');
      return;
    }

    try {
      setDocumentLoading(true);
      setError('');
      const result = await analyzeDocument(selectedDocument.id, documentInstruction);
      setDocumentResult(result);
    } catch (_error) {
      setError('Não foi possível analisar o documento.');
    } finally {
      setDocumentLoading(false);
    }
  }

  async function handleAutomation(flow: AutomationFlow) {
    setError('');
    try {
      await runAutomation(flow.id, prompt);
      setPrompt(`Executar automação: ${flow.titulo}\n\n${prompt}`);
    } catch (_error) {
      setError('Não foi possível executar a automação selecionada.');
    }
  }

  function handleLogout() {
    clearAuthToken();
    setUsuario(null);
    setProjects([]);
    setFiles([]);
    setConversions([]);
    setAutomations([]);
    setIntegrations([]);
    setPrivacyExport(null);
  }

  async function handleConsentAction(accepted: boolean) {
    try {
      const record = await registerConsent(consentScope, accepted);
      setConsentRequest((current) => current ? { ...current, message: accepted ? 'Consentimento registrado com sucesso.' : current.message } : current);
      setError('');
      setPrivacyExport((current) => current ? { ...current, consents: [record, ...current.consents] } : current);
    } catch (_error) {
      setError('Não foi possível registrar o consentimento.');
    }
  }

  async function handleExportPrivacy() {
    try {
      const data = await exportUserData();
      setPrivacyExport(data);
      setError('');
    } catch (_error) {
      setError('Não foi possível exportar os dados do usuário.');
    }
  }

  async function handleDeletePrivacy() {
    const confirmed = window.confirm('Excluir todos os seus dados desta instância local?');
    if (!confirmed) return;

    try {
      await deleteUserData();
      handleLogout();
    } catch (_error) {
      setError('Não foi possível excluir os dados do usuário.');
    }
  }

  if (!usuario) {
    return (
      <main className="login-shell">
        <section className="login-panel">
          <div className="login-topline">
            <MindosLogo />
            <ThemeToggle />
          </div>
          <h1>Console inteligente de IA</h1>
          <p className="login-copy">Entre para acessar agentes, projetos, arquivos, automações e o fluxo Deep Claw.</p>
          <p className="login-copy">Conta demo: demo@operix.local / operix123</p>
          <p className="login-copy">Conta admin local: admin@mind.local / MindAdmin123!</p>
          {oauthProcessing && <p className="login-copy">Processando login SSO...</p>}
          {error && <p className="error-message">{error}</p>}
          <form className="login-form" onSubmit={handleLogin}>
            <label>E-mail<input name="email" defaultValue="demo@operix.local" /></label>
            <label>Senha<input name="senha" type="password" defaultValue="operix123" /></label>
            <button type="submit" disabled={authLoading}>{authLoading ? 'Entrando...' : 'Entrar'}</button>
          </form>
          <div className="oauth-login-panel">
            <p>SSO/OAuth2 preparado</p>
            <div className="oauth-login-buttons">
              {oauthProviders.map((provider) => (
                <button
                  key={provider.provider}
                  type="button"
                  disabled={authLoading || oauthProcessing}
                  onClick={() => void handleOAuthLogin(provider.provider)}
                >
                  {provider.label}{provider.enabled ? '' : ' (demo)'}
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <AppLayout activeView={activeView} onConsole={() => setActiveView('console')} onProject={() => setActiveView('projeto')}>
      {activeView === 'projeto' ? (
        <ProjectWorkspace
          projects={projects}
          files={files}
          onBack={() => setActiveView('console')}
        />
      ) : (
      <section className="console-layout">
        <Sidebar usuario={usuario} items={sidebarItems} onProject={() => setActiveView('projeto')} onLogout={handleLogout} />
        <TerminalPanel logs={result?.logs || []} />

        <section className="chat-column">
          <PanelTitle title="Console Deep Claw" subtitle={`Custo estimado acumulado: USD ${totalCost}`} />
          <DocumentFlow
            documents={documents}
            selectedDocument={selectedDocument}
            instruction={documentInstruction}
            result={documentResult}
            loading={documentLoading}
            onUpload={handleDocumentUpload}
            onInstruction={setDocumentInstruction}
            onSelectDocument={setSelectedDocument}
            onAnalyze={handleDocumentAnalyze}
          />
          <div className="automation-strip">
            {automations.slice(0, 7).map((flow) => <button key={flow.id} type="button" onClick={() => void handleAutomation(flow)}>{flow.titulo}{flow.premium ? ' · Premium' : ''}</button>)}
          </div>
          <div className="chat-surface">
            <article className="message user-message"><span>Você</span><p>{prompt}</p></article>
            <article className="message ai-message">
              <span>Deep Claw</span>
              {result ? <pre>{result.respostaFinal}</pre> : <p>Digite um comando para transformar conversas, arquivos e intenções em entregáveis prontos.</p>}
              <div className="message-actions"><button type="button">Copiar</button><button type="button">Avaliar</button><button type="button">Regerar</button></div>
            </article>
            {result && <ResultViewer result={result} onCreateProject={() => setActiveView('projeto')} />}
          </div>
          {error && <p className="error-message">{error}</p>}
          <ExecutionStatus runtimeDecision={runtimeDecision} premiumEstimate={premiumEstimate} />
          <CommandInput commandMode={commandMode} prompt={prompt} loading={loading} onCommandMode={setCommandMode} onPrompt={setPrompt} onSubmit={handleSubmit} />
        </section>

        <RightPanelTabs
          usuario={usuario}
          projects={projects}
          files={files}
          conversionsByCategory={conversionsByCategory}
          integrations={integrations}
          telegramIntegrations={telegramIntegrations}
          telegramBotToken={telegramBotToken}
          telegramConnectResult={telegramConnectResult}
          setupStatus={setupStatus}
          apiKeys={apiKeys}
          setupAdminName={setupAdminName}
          setupAdminEmail={setupAdminEmail}
          setupAdminPassword={setupAdminPassword}
          setupAdminToken={setupAdminToken}
          apiKeyName={apiKeyName}
          apiKeyScopes={apiKeyScopes}
          oauthProviders={oauthProviders}
          oauthSummary={oauthSummary}
          oauthDiagnostics={oauthDiagnostics}
          premiumEstimate={premiumEstimate}
          runtimeDecision={runtimeDecision}
          totalCost={totalCost}
          observability={observability}
          securityLogs={securityLogs}
          consentScope={consentScope}
          consentRequest={consentRequest}
          privacyExport={privacyExport}
          onToggleOAuthProvider={handleToggleOAuthProvider}
          onResetOAuthProvider={handleResetOAuthProvider}
          onResetAllOAuthProviders={handleResetAllOAuthProviders}
          onRefreshOAuthDiagnostics={handleRefreshOAuthDiagnostics}
          onCreateProject={handleCreateProject}
          onFileUpload={handleFileUpload}
          onTelegramBotTokenChange={setTelegramBotToken}
          onTelegramConnect={handleTelegramConnect}
          onTelegramRefreshPairing={handleTelegramRefreshPairing}
          onTelegramDisable={handleTelegramDisable}
          onTelegramRemove={handleTelegramRemove}
          onTelegramTest={handleTelegramTest}
          onSetupAdminNameChange={setSetupAdminName}
          onSetupAdminEmailChange={setSetupAdminEmail}
          onSetupAdminPasswordChange={setSetupAdminPassword}
          onSetupAdminTokenChange={setSetupAdminToken}
          onSetupCreateAdmin={handleSetupCreateAdmin}
          onSetupValidateDatabase={() => handleSetupValidation('database')}
          onSetupValidateStorage={() => handleSetupValidation('storage')}
          onSetupValidateAws={() => handleSetupValidation('aws')}
          onSetupValidateEmail={() => handleSetupValidation('email')}
          onApiKeyNameChange={setApiKeyName}
          onApiKeyScopesChange={setApiKeyScopes}
          onCreateApiKey={handleCreateApiKey}
          onRotateApiKey={handleRotateApiKey}
          onRevokeApiKey={handleRevokeApiKey}
          onConsentScopeChange={setConsentScope}
          onConsentAction={handleConsentAction}
          onExportPrivacy={handleExportPrivacy}
          onDeletePrivacy={handleDeletePrivacy}
        />
      </section>
      )}
    </AppLayout>
  );
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('operix.theme');
    return stored === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('operix.theme', theme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    toggleTheme: () => setTheme((current) => current === 'dark' ? 'light' : 'dark')
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label="Alternar tema">
      <span className="theme-toggle-track"><span className="theme-toggle-dot" /></span>
      {theme === 'dark' ? 'Dark' : 'Light'}
    </button>
  );
}

function MindosLogo() {
  return (
    <div className="mindos-logo" aria-label="Mindos">
      <span className="mindos-mark">M</span>
      <span className="mindos-word">
        <strong>Mindos</strong>
        <small>OPERIX MIND</small>
      </span>
    </div>
  );
}

function AppLayout({ activeView, onConsole, onProject, children }: {
  activeView: 'console' | 'projeto';
  onConsole: () => void;
  onProject: () => void;
  children: React.ReactNode;
}) {
  return (
    <main className="desktop-shell">
      <Header activeView={activeView} onConsole={onConsole} onProject={onProject} />
      <ToolbarActions />
      {children}
    </main>
  );
}

function Header({ activeView, onConsole, onProject }: { activeView: 'console' | 'projeto'; onConsole: () => void; onProject: () => void }) {
  return (
    <header className="app-header">
      <MindosLogo />
      <TopBrowserTabs activeView={activeView} onConsole={onConsole} onProject={onProject} />
      <ThemeToggle />
    </header>
  );
}

function TopBrowserTabs({ activeView, onConsole, onProject }: { activeView: 'console' | 'projeto'; onConsole: () => void; onProject: () => void }) {
  return (
    <section className="browser-bar">
      <div className="window-controls"><span /><span /><span /></div>
      <div className="browser-actions"><button type="button">‹</button><button type="button">›</button><button type="button">↻</button></div>
      <div className="tabs">
        <button type="button" className={`tab ${activeView === 'console' ? 'active' : ''}`} onClick={onConsole}>Console Deep Claw</button>
        <button type="button" className={`tab ${activeView === 'projeto' ? 'active' : ''}`} onClick={onProject}>Projeto</button>
        <button type="button" className="tab">Arquivos</button>
      </div>
      <div className="address">mind-ia://console/resultado/projeto/financeiro</div>
    </section>
  );
}

function ToolbarActions() {
  return (
    <section className="tool-ribbon">
      {toolbarItems.filter((item) => item !== 'Tema').map((item) => <button key={item} type="button">{item}</button>)}
    </section>
  );
}

function Sidebar({ usuario, items, onProject, onLogout }: { usuario: Usuario; items: string[]; onProject: () => void; onLogout: () => void }) {
  return (
    <aside className="main-sidebar">
      <div className="brand-block"><MindosLogo /><span>{usuario.nome} · {usuario.plano} · {usuario.role || 'user'}</span></div>
      <nav>{items.map((item) => <button key={item} type="button" onClick={item === 'Projetos' ? onProject : undefined}>{item}</button>)}</nav>
      <button type="button" className="account-button" onClick={onLogout}>Login / Conta · Sair</button>
    </aside>
  );
}

function TerminalPanel({ logs }: { logs: AiLog[] }) {
  return (
    <section className="terminal-column">
      <PanelTitle title="Terminal" subtitle="Execução, debug, logs e IAs" />
      <div className="terminal-tabs">{['Terminal', 'Saída', 'Debug', 'Logs', 'IAs'].map((item) => <button key={item} type="button">{item}</button>)}</div>
      <div className="terminal-stream">
        {logs.map((log) => <p key={`${log.criadoEm}-${log.etapa}-${log.decisao}`}><span>{log.etapa}</span> {log.agente || 'sistema'}: {log.detalhe}</p>)}
        {logs.length === 0 && <p><span>sistema</span> aguardando comando do usuário</p>}
      </div>
    </section>
  );
}

function DocumentFlow({ documents, selectedDocument, instruction, result, loading, onUpload, onInstruction, onSelectDocument, onAnalyze }: {
  documents: FileInfo[];
  selectedDocument: FileInfo | null;
  instruction: string;
  result: DocumentAnalysisResult | null;
  loading: boolean;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onInstruction: (value: string) => void;
  onSelectDocument: (document: FileInfo) => void;
  onAnalyze: () => void;
}) {
  return (
    <section className="document-flow">
      <header>
        <div>
          <p className="eyebrow">Fluxo principal</p>
          <h2>Documento → IA → Resultado</h2>
        </div>
        <label className="upload-button">
          Upload
          <input type="file" accept=".pdf,.docx,.xlsx,.csv,.txt,.png,.jpg,.jpeg" onChange={onUpload} />
        </label>
      </header>

      <div className="document-flow-grid">
        <div className="document-picker">
          <strong>Documento</strong>
          {selectedDocument ? (
            <p>{selectedDocument.nomeOriginal} · {selectedDocument.formato.toUpperCase()} · {(selectedDocument.tamanhoBytes / 1024).toFixed(1)} KB</p>
          ) : (
            <p>Envie PDF, DOCX, XLSX, CSV, TXT, PNG ou JPG.</p>
          )}
          <div className="document-list">
            {documents.slice(0, 5).map((document) => (
              <button key={document.id} type="button" className={selectedDocument?.id === document.id ? 'active' : ''} onClick={() => onSelectDocument(document)}>
                {document.nomeOriginal}
              </button>
            ))}
          </div>
        </div>

        <label className="document-instruction">
          Instrução para IA
          <textarea value={instruction} onChange={(event) => onInstruction(event.target.value)} />
        </label>

        <div className="document-result">
          <div className="panel-actions">
            <strong>Resultado</strong>
            <button type="button" disabled={loading || !selectedDocument || !instruction.trim()} onClick={onAnalyze}>
              {loading ? 'Analisando...' : 'Analisar'}
            </button>
          </div>
          {result ? (
            <article>
              <span>{result.adapter === 'bedrock' ? 'Bedrock' : 'Local/mock'} · {result.tokensEstimated} tokens</span>
              <pre>{result.summary}</pre>
              <strong>Insights</strong>
              <SmallList items={result.insights} />
              <strong>Próximos passos</strong>
              <SmallList items={result.nextActions} />
            </article>
          ) : (
            <p>O resultado da IA aparece aqui após a análise.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function ExecutionStatus({ runtimeDecision, premiumEstimate }: { runtimeDecision: RuntimeDecision | null; premiumEstimate: PremiumEstimate | null }) {
  return (
    <section className="execution-status">
      <span>Runtime: <strong>{runtimeDecision?.runtime || 'aguardando'}</strong></span>
      <span>Modelo: <strong>{runtimeDecision?.modeloSugerido || premiumEstimate?.cost.modelo || 'a decidir'}</strong></span>
      <span>Tokens: <strong>{runtimeDecision?.tokensEstimados ?? premiumEstimate?.cost.tokensEntrada ?? 0}</strong></span>
      <span>Custo: <strong>USD {(runtimeDecision?.custoEstimadoUsd ?? premiumEstimate?.cost.custoEstimadoUsd ?? 0).toFixed(6)}</strong></span>
    </section>
  );
}

function ModelModeSelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="conversa">Conversa</option>
      <option value="codex">Codex / debug</option>
      <option value="orçamento">Orçamento</option>
      <option value="proposta">Proposta</option>
      <option value="relatório">Relatório</option>
      <option value="dashboard">Dashboard</option>
    </select>
  );
}

function CommandInput({ commandMode, prompt, loading, onCommandMode, onPrompt, onSubmit }: {
  commandMode: string;
  prompt: string;
  loading: boolean;
  onCommandMode: (value: string) => void;
  onPrompt: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="command-bar" onSubmit={onSubmit}>
      <ModelModeSelector value={commandMode} onChange={onCommandMode} />
      <textarea value={prompt} onChange={(event) => onPrompt(event.target.value)} />
      <button type="submit" disabled={loading || !prompt.trim()}>{loading ? 'Executando...' : 'Executar'}</button>
    </form>
  );
}

function ResultViewer({ result, onCreateProject }: { result: AiExecutionResult; onCreateProject: () => void }) {
  return (
    <section className="result-viewer">
      <header><strong>Resultado gerado</strong><span>Permanece dentro do console</span></header>
      <GeneratedDocumentPreview result={result} />
      <NextStepActions onCreateProject={onCreateProject} />
    </section>
  );
}

function GeneratedDocumentPreview({ result }: { result: AiExecutionResult }) {
  return (
    <article className="generated-preview">
      <strong>Prévia do documento</strong>
      <p>{result.usoTokens.length} chamada(s) de IA registradas. Documento pronto para proposta, relatório ou projeto.</p>
    </article>
  );
}

function NextStepActions({ onCreateProject }: { onCreateProject: () => void }) {
  return (
    <div className="result-actions">
      <ExportButtons />
      {['Editar', 'Gerar proposta', 'Gerar relatório', 'Enviar para financeiro', 'Salvar histórico'].map((action) => (
        <button key={action} type="button">{action}</button>
      ))}
      <button type="button" onClick={onCreateProject}>Criar projeto</button>
    </div>
  );
}

function ExportButtons() {
  return (
    <>
      <button type="button">Baixar PDF</button>
      <button type="button">Exportar DOCX</button>
    </>
  );
}

function PanelTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return <header className="panel-title"><h2>{title}</h2><span>{subtitle}</span></header>;
}

function SmallList({ items }: { items: string[] }) {
  return <div className="compact-list">{items.length === 0 ? <p>Nenhum item ainda.</p> : items.map((item) => <p key={item}>{item}</p>)}</div>;
}

function RightPanelTabs({ usuario, projects, files, conversionsByCategory, integrations, telegramIntegrations, telegramBotToken, telegramConnectResult, setupStatus, apiKeys, setupAdminName, setupAdminEmail, setupAdminPassword, setupAdminToken, apiKeyName, apiKeyScopes, oauthProviders, oauthSummary, oauthDiagnostics, premiumEstimate, runtimeDecision, totalCost, observability, securityLogs, consentScope, consentRequest, privacyExport, onToggleOAuthProvider, onResetOAuthProvider, onResetAllOAuthProviders, onRefreshOAuthDiagnostics, onCreateProject, onFileUpload, onTelegramBotTokenChange, onTelegramConnect, onTelegramRefreshPairing, onTelegramDisable, onTelegramRemove, onTelegramTest, onSetupAdminNameChange, onSetupAdminEmailChange, onSetupAdminPasswordChange, onSetupAdminTokenChange, onSetupCreateAdmin, onSetupValidateDatabase, onSetupValidateStorage, onSetupValidateAws, onSetupValidateEmail, onApiKeyNameChange, onApiKeyScopesChange, onCreateApiKey, onRotateApiKey, onRevokeApiKey, onConsentScopeChange, onConsentAction, onExportPrivacy, onDeletePrivacy }: {
  usuario: Usuario;
  projects: ProjectInfo[];
  files: FileInfo[];
  conversionsByCategory: Record<string, ConversionOption[]>;
  integrations: IntegrationInfo[];
  telegramIntegrations: TelegramIntegrationInfo[];
  telegramBotToken: string;
  telegramConnectResult: TelegramConnectResult | null;
  setupStatus: SetupStatus | null;
  apiKeys: ApiKeyInfo[];
  setupAdminName: string;
  setupAdminEmail: string;
  setupAdminPassword: string;
  setupAdminToken: string;
  apiKeyName: string;
  apiKeyScopes: string;
  oauthProviders: OAuthProviderInfo[];
  oauthSummary: OAuthRuntimeSummary | null;
  oauthDiagnostics: OAuthDiagnosticsExport | null;
  premiumEstimate: PremiumEstimate | null;
  runtimeDecision: RuntimeDecision | null;
  totalCost: string;
  observability: ObservabilitySnapshot | null;
  securityLogs: AppLog[];
  consentScope: string;
  consentRequest: ConsentRequest | null;
  privacyExport: UserDataExport | null;
  onToggleOAuthProvider: (provider: OAuthProviderInfo['provider'], enabled: boolean) => void;
  onResetOAuthProvider: (provider: OAuthProviderInfo['provider']) => void;
  onResetAllOAuthProviders: () => void;
  onRefreshOAuthDiagnostics: () => void;
  onCreateProject: () => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onTelegramBotTokenChange: (value: string) => void;
  onTelegramConnect: () => void;
  onTelegramRefreshPairing: () => void;
  onTelegramDisable: (integrationId: string) => void;
  onTelegramRemove: (integrationId: string) => void;
  onTelegramTest: (integrationId: string) => void;
  onSetupAdminNameChange: (value: string) => void;
  onSetupAdminEmailChange: (value: string) => void;
  onSetupAdminPasswordChange: (value: string) => void;
  onSetupAdminTokenChange: (value: string) => void;
  onSetupCreateAdmin: () => void;
  onSetupValidateDatabase: () => void;
  onSetupValidateStorage: () => void;
  onSetupValidateAws: () => void;
  onSetupValidateEmail: () => void;
  onApiKeyNameChange: (value: string) => void;
  onApiKeyScopesChange: (value: string) => void;
  onCreateApiKey: () => void;
  onRotateApiKey: (apiKeyId: string) => void;
  onRevokeApiKey: (apiKeyId: string) => void;
  onConsentScopeChange: (scope: string) => void;
  onConsentAction: (accepted: boolean) => void;
  onExportPrivacy: () => void;
  onDeletePrivacy: () => void;
}) {
  return (
    <aside className="right-inspector">
      <details open>
        <summary>Setup e infraestrutura</summary>
        {setupStatus && (
          <div className="cost-grid">
            <span>Setup</span><strong>{setupStatus.locked ? 'bloqueado' : 'aberto'}</strong>
            <span>Banco</span><strong>{setupStatus.database.connected ? 'conectado' : 'pendente'}</strong>
            <span>Storage</span><strong>{setupStatus.storage.driver}</strong>
            <span>AWS</span><strong>{setupStatus.aws.status}</strong>
            <span>Email</span><strong>{setupStatus.email.status}</strong>
            <span>Telegram</span><strong>{setupStatus.telegram.status}</strong>
          </div>
        )}
        <div className="panel-actions">
          <button type="button" onClick={onSetupValidateDatabase}>Testar banco</button>
          <button type="button" onClick={onSetupValidateStorage}>Testar storage</button>
          <button type="button" onClick={onSetupValidateAws}>Testar AWS</button>
          <button type="button" onClick={onSetupValidateEmail}>Testar e-mail</button>
        </div>
        {setupStatus && !setupStatus.locked && (
          <div className="privacy-panel">
            <label>
              Nome do admin
              <input value={setupAdminName} onChange={(event) => onSetupAdminNameChange(event.target.value)} />
            </label>
            <label>
              E-mail do admin
              <input value={setupAdminEmail} onChange={(event) => onSetupAdminEmailChange(event.target.value)} />
            </label>
            <label>
              Senha do admin
              <input type="password" value={setupAdminPassword} onChange={(event) => onSetupAdminPasswordChange(event.target.value)} />
            </label>
            <label>
              SETUP_TOKEN
              <input value={setupAdminToken} onChange={(event) => onSetupAdminTokenChange(event.target.value)} />
            </label>
            <button type="button" onClick={onSetupCreateAdmin}>Criar admin inicial</button>
          </div>
        )}
      </details>
      <details open>
        <summary>API keys</summary>
        <div className="privacy-panel">
          <label>
            Nome
            <input value={apiKeyName} onChange={(event) => onApiKeyNameChange(event.target.value)} />
          </label>
          <label>
            Scopes
            <input value={apiKeyScopes} onChange={(event) => onApiKeyScopesChange(event.target.value)} />
          </label>
          <div className="panel-actions">
            <button type="button" onClick={onCreateApiKey}>Criar API key</button>
          </div>
        </div>
        <div className="integration-list">
          {apiKeys.slice(0, 8).map((apiKey) => (
            <article key={apiKey.id}>
              <strong>{apiKey.name}</strong>
              <span>{apiKey.keyPrefix} · {apiKey.status}{apiKey.expiresAt ? ` · expira ${new Date(apiKey.expiresAt).toLocaleDateString('pt-BR')}` : ''}</span>
              <div className="panel-actions">
                <button type="button" onClick={() => onRotateApiKey(apiKey.id)}>Rotacionar</button>
                <button type="button" onClick={() => onRevokeApiKey(apiKey.id)}>Revogar</button>
              </div>
            </article>
          ))}
        </div>
      </details>
      <details open>
        <summary>Arquivos e projetos</summary>
        <div className="panel-actions"><button type="button" onClick={onCreateProject}>Criar projeto</button><label className="upload-button">Upload<input type="file" onChange={onFileUpload} /></label></div>
        <SmallList items={[...projects.map((p) => `${p.nome} · ${p.status}`), ...files.map((f) => `${f.nomeOriginal} · ${f.status}`)].slice(0, 6)} />
      </details>
      <details open>
        <summary>Conversões</summary>
        {Object.entries(conversionsByCategory).map(([category, items]) => (
          <div className="conversion-group" key={category}>
            <h3>{categoryLabels[category] || category}</h3>
            <div className="chip-grid">
              {items.slice(0, 10).map((option) => (
                <button key={option.id} type="button" title={`${option.plugin}: ${option.engines.join(', ')}`}>
                  {option.origem} → {option.destino}
                  {option.requerBinarioLocal ? ' · CLI' : ''}
                  {option.requerCredencial ? ' · API' : ''}
                </button>
              ))}
            </div>
          </div>
        ))}
      </details>
      <details open>
        <summary>Integrações</summary>
        <div className="integration-list">{integrations.slice(0, 12).map((integration) => <article key={integration.id}><strong>{integration.nome}</strong><span>{integration.status}{integration.premium ? ' · premium' : ''}</span><button type="button">Conectar</button></article>)}</div>
        <div className="telegram-panel">
          <h3>Telegram</h3>
          <label>
            Token do BotFather
            <input value={telegramBotToken} onChange={(event) => onTelegramBotTokenChange(event.target.value)} placeholder="123456789:ABCDEF..." />
          </label>
          <div className="panel-actions">
            <button type="button" onClick={onTelegramConnect}>Conectar bot</button>
            <button type="button" onClick={onTelegramRefreshPairing} disabled={!telegramConnectResult}>Renovar QR</button>
          </div>
          {telegramConnectResult && (
            <article className="telegram-card">
              <strong>{telegramConnectResult.botName}</strong>
              <span>@{telegramConnectResult.botUsername} · {telegramConnectResult.status}</span>
              <img src={telegramConnectResult.qrCodeDataUrl} alt="QR Code Telegram" />
              <a href={telegramConnectResult.deepLink} target="_blank" rel="noreferrer">Abrir no Telegram</a>
              <p>Expira em {new Date(telegramConnectResult.expiresAt).toLocaleString('pt-BR')}</p>
              {telegramConnectResult.warning && <p className="premium-warning">{telegramConnectResult.warning}</p>}
            </article>
          )}
          <div className="integration-list">
            {telegramIntegrations.map((integration) => (
              <article key={integration.id}>
                <strong>{integration.botName}</strong>
                <span>@{integration.botUsername} · {integration.status}{integration.chatId ? ` · chat ${integration.chatId}` : ''}</span>
                <div className="panel-actions">
                  <button type="button" onClick={() => onTelegramTest(integration.id)}>Enviar teste</button>
                  <button type="button" onClick={() => onTelegramDisable(integration.id)}>Desativar</button>
                  <button type="button" onClick={() => onTelegramRemove(integration.id)}>Remover</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </details>
      {(usuario.role === 'admin' || usuario.role === 'enterprise') && (
        <details open>
          <summary>SSO e provedores</summary>
          {oauthSummary && (
            <div className="cost-grid">
              <span>Total</span><strong>{oauthSummary.totalProviders}</strong>
              <span>Ambiente</span><strong>{oauthSummary.envEnabled}</strong>
              <span>Admin</span><strong>{oauthSummary.adminEnabled}</strong>
              <span>Overrides</span><strong>{oauthSummary.overridden}</strong>
              <span>Desativados</span><strong>{oauthSummary.disabled}</strong>
            </div>
          )}
          <div className="panel-actions">
            <button type="button" onClick={onResetAllOAuthProviders}>Restaurar todos</button>
            <button type="button" onClick={onRefreshOAuthDiagnostics}>Atualizar diagnóstico</button>
          </div>
          {oauthDiagnostics && (
            <p className="premium-warning">
              Exportado em {new Date(oauthDiagnostics.generatedAt).toLocaleString('pt-BR')} · {oauthDiagnostics.providers.length} provedor(es)
            </p>
          )}
          <div className="integration-list">
            {oauthProviders.map((provider) => (
              <article key={provider.provider}>
                <strong>{provider.label}</strong>
                <span>{provider.enabled ? 'ativo' : 'inativo'} · {provider.source}{provider.updatedBy ? ` · ${provider.updatedBy}` : ''}</span>
                <div className="panel-actions">
                  <button type="button" onClick={() => onToggleOAuthProvider(provider.provider, !provider.enabled)}>
                    {provider.enabled ? 'Desativar' : 'Ativar'}
                  </button>
                  {provider.source === 'admin' && (
                    <button type="button" onClick={() => onResetOAuthProvider(provider.provider)}>
                      Restaurar padrão
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </details>
      )}
      <details open>
        <summary>Custos e tokens</summary>
        <div className="cost-grid">
          <span>Uso do dia</span><strong>USD {totalCost}</strong>
          <span>Modelo premium</span><strong>{premiumEstimate?.cost.modelo || 'Bedrock preparado'}</strong>
          <span>Entrada</span><strong>{premiumEstimate?.cost.tokensEntrada || runtimeDecision?.tokensEstimados || 0} tokens</strong>
          <span>Saída</span><strong>{premiumEstimate?.cost.tokensSaida || 0} tokens</strong>
          <span>Limite do plano</span><strong>USD {runtimeDecision?.limitePlanoUsd ?? premiumEstimate?.cost.limitePlanoUsd ?? 0}</strong>
          <span>Runtime</span><strong>{runtimeDecision?.runtime || 'aguardando'}</strong>
          <span>Modelo</span><strong>{runtimeDecision?.modeloSugerido || 'a decidir'}</strong>
          <span>Dispositivo</span><strong>{runtimeDecision?.classeDispositivo || 'detectando'}</strong>
          <span>Complexidade</span><strong>{runtimeDecision?.complexidade || 'a avaliar'}</strong>
        </div>
        {runtimeDecision && <p className="premium-warning">{runtimeDecision.motivo} Fallback: {runtimeDecision.fallback}.</p>}
        <p className="premium-warning">Bedrock fica bloqueado para tarefas simples e só entra quando a política premium permitir.</p>
      </details>
      <details open>
        <summary>Operação e segurança</summary>
        <div className="observability-grid">
          <Metric title="Uptime" value={`${observability?.uptimeSeconds ?? 0}s`} />
          <Metric title="Requests" value={`${observability?.totalRequests ?? 0}`} />
          <Metric title="Erros" value={`${observability?.totalErrors ?? 0}`} />
          <Metric title="Bloqueios" value={`${observability?.blockedRequests ?? 0}`} />
          <Metric title="IA" value={`${observability?.aiRequests ?? 0}`} />
          <Metric title="Uploads" value={`${observability?.uploadedFiles ?? 0}`} />
        </div>
        <div className="observability-stack">
          <article className="observability-card">
            <strong>Últimas requisições</strong>
            <SmallList items={(observability?.recentRequests || []).slice(0, 5).map((entry) => `${entry.method} ${entry.route} · ${entry.statusCode} · ${entry.durationMs}ms`)} />
          </article>
          <article className="observability-card">
            <strong>Logs de segurança</strong>
            <SmallList items={securityLogs.slice(0, 5).map((entry) => `${entry.level} · ${entry.origem} · ${entry.mensagem}`)} />
          </article>
        </div>
      </details>
      <details open>
        <summary>Privacidade e LGPD</summary>
        <div className="privacy-panel">
          <label>
            Escopo de consentimento
            <select value={consentScope} onChange={(event) => onConsentScopeChange(event.target.value)}>
              <option value="processing">processing</option>
              <option value="ai_assistance">ai_assistance</option>
              <option value="storage">storage</option>
              <option value="analytics">analytics</option>
              <option value="marketing">marketing</option>
            </select>
          </label>
          <div className="privacy-actions">
            <button type="button" onClick={() => onConsentAction(true)}>Aceitar consentimento</button>
            <button type="button" onClick={() => onConsentAction(false)}>Recusar consentimento</button>
            <button type="button" onClick={onExportPrivacy}>Exportar dados</button>
            <button type="button" onClick={onDeletePrivacy}>Excluir dados</button>
          </div>
          {consentRequest && <p className="premium-warning">{consentRequest.message}</p>}
          {privacyExport && (
            <div className="privacy-export">
              <strong>Exportação pronta</strong>
              <p>{privacyExport.consents.length} consentimento(s), {privacyExport.files.length} arquivo(s) e {privacyExport.projects.length} projeto(s).</p>
            </div>
          )}
        </div>
      </details>
    </aside>
  );
}

function ProjectWorkspace({ projects, files, onBack }: { projects: ProjectInfo[]; files: FileInfo[]; onBack: () => void }) {
  const project = projects[0];
  const [tab, setTab] = useState('Visão geral');
  const custoTotal = 18450;
  const precoVenda = 27600;
  const lucro = precoVenda - custoTotal;
  const margem = Math.round((lucro / precoVenda) * 100);

  return (
    <section className="project-workspace">
      <aside className="project-sidebar">
        <button type="button" onClick={onBack}>Voltar ao console</button>
        {['Visão geral', 'Orçamento', 'Proposta', 'Arquivos', 'Histórico', 'Financeiro', 'Fiscal futuro'].map((item) => (
          <button key={item} type="button" className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>
        ))}
      </aside>
      <section className="project-content">
        <header className="project-header">
          <div><p className="eyebrow">Projeto</p><h1>{project?.nome || 'Projeto Mind_IA'}</h1><span>Cliente: Cliente em definição · Status: {project?.status || 'rascunho'}</span></div>
          <button type="button">Exportar pacote</button>
        </header>
        {tab === 'Financeiro' ? <ProjectFinancialView custoTotal={custoTotal} precoVenda={precoVenda} lucro={lucro} margem={margem} /> : null}
        {tab === 'Fiscal futuro' ? <FiscalPlaceholder /> : null}
        {tab === 'Visão geral' ? <ProjectOverview files={files} /> : null}
        {tab === 'Orçamento' ? <ProjectBudgetView /> : null}
        {tab === 'Proposta' ? <ProjectProposalView /> : null}
        {tab === 'Arquivos' ? <ProjectFiles files={files} /> : null}
        {tab === 'Histórico' ? <ProjectHistory /> : null}
      </section>
    </section>
  );
}

function ProjectOverview({ files }: { files: FileInfo[] }) {
  return (
    <div className="project-grid">
      <article><h2>Visão geral</h2><p>Entregável criado no console, com orçamento, proposta, arquivos e histórico prontos para evolução dentro do projeto.</p></article>
      <article><h2>Arquivos recentes</h2><SmallList items={files.map((file) => `${file.nomeOriginal} · ${file.status}`).slice(0, 6)} /></article>
      <article><h2>Próximas ações</h2><p>Revisar escopo, validar custos, gerar proposta comercial e salvar versão aprovada no histórico.</p></article>
    </div>
  );
}

function ProjectBudgetView() {
  return (
    <div className="project-grid">
      <article><h2>Orçamento automático</h2><p>Materiais, mão de obra, operação, margem e riscos calculados a partir dos arquivos e comandos do console.</p></article>
      <article><h2>Itens</h2><p>Estrutura preparada para linhas de custo, quantidades, fornecedores e anexos técnicos.</p></article>
    </div>
  );
}

function ProjectProposalView() {
  return (
    <div className="project-grid">
      <article><h2>Proposta comercial</h2><p>Documento comercial preparado a partir do orçamento aprovado, com escopo, prazo, condições e anexos.</p></article>
      <article><h2>Status</h2><p>Versão em rascunho, pronta para exportação e envio ao cliente.</p></article>
    </div>
  );
}

function ProjectFiles({ files }: { files: FileInfo[] }) {
  return (
    <div className="project-grid">
      <article><h2>Arquivos</h2><SmallList items={files.map((file) => `${file.nomeOriginal} · ${file.formato} · ${file.status}`).slice(0, 10)} /></article>
      <article><h2>Processamento</h2><p>PDF, DWG, Excel, imagens, CAD e Gerber ficam disponíveis para automações e conversões.</p></article>
    </div>
  );
}

function ProjectHistory() {
  return (
    <div className="project-grid">
      <article><h2>Histórico</h2><p>Linha do tempo preparada para comandos, versões, documentos gerados, custos recalculados e decisões de aprovação.</p></article>
      <article><h2>Auditoria</h2><p>Logs técnicos e decisões de IA ficam associados ao projeto.</p></article>
    </div>
  );
}

function ProjectFinancialView({ custoTotal, precoVenda, lucro, margem }: { custoTotal: number; precoVenda: number; lucro: number; margem: number }) {
  return (
    <div className="finance-grid">
      <FinancialSummary custoTotal={custoTotal} precoVenda={precoVenda} lucro={lucro} margem={margem} />
      <CostBreakdown />
      <ProfitCalculator lucro={lucro} />
      <MarginAnalysis margem={margem} />
      <ScenarioSimulator />
    </div>
  );
}

function FinancialSummary({ custoTotal, precoVenda, lucro, margem }: { custoTotal: number; precoVenda: number; lucro: number; margem: number }) {
  return (
    <>
      <Metric title="Custo total" value={`R$ ${custoTotal.toLocaleString('pt-BR')}`} />
      <Metric title="Preço de venda" value={`R$ ${precoVenda.toLocaleString('pt-BR')}`} />
      <Metric title="Lucro estimado" value={`R$ ${lucro.toLocaleString('pt-BR')}`} />
      <Metric title="Margem" value={`${margem}%`} />
    </>
  );
}

function CostBreakdown() {
  return <article><h2>Custo por etapa</h2><p>Materiais: R$ 11.200 · Mão de obra: R$ 5.900 · Operação: R$ 1.350</p></article>;
}

function ProfitCalculator({ lucro }: { lucro: number }) {
  return <article><h2>Lucro</h2><p>Lucro bruto simulado de R$ {lucro.toLocaleString('pt-BR')} antes de impostos e taxas futuras.</p></article>;
}

function MarginAnalysis({ margem }: { margem: number }) {
  return <article><h2>Análise de margem</h2><p>Margem estimada de {margem}% com base no preço de venda atual.</p></article>;
}

function ScenarioSimulator() {
  return <article><h2>Simulação</h2><p>Cenário base preparado. Fiscal permanece como placeholder e sem emissão nesta etapa.</p></article>;
}

function FiscalPlaceholder() {
  return (
    <div className="placeholder-panel">
      <h2>Fiscal preparado</h2>
      <p>Área reservada para integrações fiscais futuras. Nenhuma emissão fiscal foi implementada nesta etapa.</p>
      <FiscalIntegrationPlaceholder />
    </div>
  );
}

function FiscalIntegrationPlaceholder() {
  return <p className="premium-warning">Integrações fiscais ficarão isoladas do financeiro até a próxima fase.</p>;
}

function Metric({ title, value }: { title: string; value: string }) {
  return <article className="metric-card"><span>{title}</span><strong>{value}</strong></article>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><ThemeProvider><App /></ThemeProvider></StrictMode>);
