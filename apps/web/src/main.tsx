import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  clearAuthToken,
  createProject,
  decideRuntime,
  estimatePremium,
  executeAi,
  fetchAgents,
  fetchAutomationFlows,
  fetchConversionOptions,
  fetchFiles,
  fetchIntegrations,
  fetchProjects,
  login,
  me,
  runAutomation,
  uploadFile,
  type AgentInfo,
  type AiExecutionResult,
  type AiLog,
  type AutomationFlow,
  type ConversionOption,
  type FileInfo,
  type IntegrationInfo,
  type PremiumEstimate,
  type ProjectInfo,
  type RuntimeDecision,
  type Usuario
} from './services/api.js';
import './styles/global.css';

type ThemeMode = 'dark' | 'light' | 'system';

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
  const [conversions, setConversions] = useState<ConversionOption[]>([]);
  const [automations, setAutomations] = useState<AutomationFlow[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationInfo[]>([]);
  const [premiumEstimate, setPremiumEstimate] = useState<PremiumEstimate | null>(null);
  const [runtimeDecision, setRuntimeDecision] = useState<RuntimeDecision | null>(null);
  const [prompt, setPrompt] = useState('crie um sistema de orçamento');
  const [commandMode, setCommandMode] = useState('orçamento');
  const [activeView, setActiveView] = useState<'console' | 'projeto'>('console');
  const [result, setResult] = useState<AiExecutionResult | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(() => (localStorage.getItem('operix.theme') as ThemeMode) || 'dark');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('operix.theme', theme);
  }, [theme]);

  useEffect(() => {
    fetchAgents().then(setAgents).catch(() => setError('Não foi possível carregar os agentes. Verifique se a API está rodando.'));
    me().then(async (user) => {
      setUsuario(user);
      await loadWorkspace();
    }).catch(() => undefined);
  }, []);

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
    const [projectData, fileData, conversionData, automationData, integrationData] = await Promise.all([
      fetchProjects(),
      fetchFiles(),
      fetchConversionOptions(),
      fetchAutomationFlows(),
      fetchIntegrations()
    ]);
    setProjects(projectData);
    setFiles(fileData);
    setConversions(conversionData);
    setAutomations(automationData);
    setIntegrations(integrationData);
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

  async function handleAutomation(flow: AutomationFlow) {
    setError('');
    try {
      await runAutomation(flow.id, prompt);
      setPrompt(`Executar automação: ${flow.titulo}\n\n${prompt}`);
    } catch (_error) {
      setError('Não foi possível executar a automação selecionada.');
    }
  }

  function cycleTheme() {
    setTheme((current) => current === 'dark' ? 'light' : current === 'light' ? 'system' : 'dark');
  }

  function handleLogout() {
    clearAuthToken();
    setUsuario(null);
    setProjects([]);
    setFiles([]);
    setConversions([]);
    setAutomations([]);
    setIntegrations([]);
  }

  if (!usuario) {
    return (
      <main className="login-shell">
        <section className="login-panel">
          <p className="eyebrow">Mind_IA</p>
          <h1>Console inteligente de IA</h1>
          <p className="login-copy">Entre para acessar agentes, projetos, arquivos, automações e o fluxo Deep Claw.</p>
          {error && <p className="error-message">{error}</p>}
          <form className="login-form" onSubmit={handleLogin}>
            <label>E-mail<input name="email" defaultValue="demo@operix.local" /></label>
            <label>Senha<input name="senha" type="password" defaultValue="operix123" /></label>
            <button type="submit" disabled={authLoading}>{authLoading ? 'Entrando...' : 'Entrar'}</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="desktop-shell">
      <TopBrowserTabs activeView={activeView} onConsole={() => setActiveView('console')} onProject={() => setActiveView('projeto')} />
      <ToolbarActions theme={theme} onTheme={cycleTheme} />

      {activeView === 'projeto' ? (
        <ProjectWorkspace
          projects={projects}
          files={files}
          onBack={() => setActiveView('console')}
        />
      ) : (
      <section className="console-layout">
        <SidebarMenu usuario={usuario} items={sidebarItems} onProject={() => setActiveView('projeto')} onLogout={handleLogout} />
        <TerminalPanel logs={result?.logs || []} />

        <section className="chat-column">
          <PanelTitle title="Console Deep Claw" subtitle={`Custo estimado acumulado: USD ${totalCost}`} />
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
          projects={projects}
          files={files}
          conversionsByCategory={conversionsByCategory}
          integrations={integrations}
          premiumEstimate={premiumEstimate}
          runtimeDecision={runtimeDecision}
          totalCost={totalCost}
          onCreateProject={handleCreateProject}
          onFileUpload={handleFileUpload}
        />
      </section>
      )}
    </main>
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

function ToolbarActions({ theme, onTheme }: { theme: ThemeMode; onTheme: () => void }) {
  return (
    <section className="tool-ribbon">
      {toolbarItems.map((item) => <button key={item} type="button" onClick={item === 'Tema' ? onTheme : undefined}>{item === 'Tema' ? `Tema: ${theme}` : item}</button>)}
    </section>
  );
}

function SidebarMenu({ usuario, items, onProject, onLogout }: { usuario: Usuario; items: string[]; onProject: () => void; onLogout: () => void }) {
  return (
    <aside className="main-sidebar">
      <div className="brand-block"><strong>Mind_IA</strong><span>{usuario.nome} · {usuario.plano}</span></div>
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

function RightPanelTabs({ projects, files, conversionsByCategory, integrations, premiumEstimate, runtimeDecision, totalCost, onCreateProject, onFileUpload }: {
  projects: ProjectInfo[];
  files: FileInfo[];
  conversionsByCategory: Record<string, ConversionOption[]>;
  integrations: IntegrationInfo[];
  premiumEstimate: PremiumEstimate | null;
  runtimeDecision: RuntimeDecision | null;
  totalCost: string;
  onCreateProject: () => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <aside className="right-inspector">
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
      </details>
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

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
