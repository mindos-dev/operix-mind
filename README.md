# OPERIX MIND

OPERIX MIND sera uma plataforma SaaS/hibrida que funciona como console inteligente de IA, automacao, arquivos, projetos e agentes especializados.

## Estado Atual Executavel

Base local funcional criada e validada.

O projeto agora possui:

- monorepo Node.js com TypeScript;
- nucleo de IA em `packages/ai-agents`;
- fluxo Deep Claw em modo mock/controlado;
- melhoria de prompt com fluxo Gemma;
- roteador de agentes;
- economia e logs de tokens;
- API Express em `apps/api`;
- frontend React/Vite em `apps/web`;
- autenticacao JWT inicial com usuario demo local;
- modulos base de projetos, arquivos e conversoes;
- Prisma configurado em `apps/api/prisma/schema.prisma`;
- agente local inicial em `local-agent`;
- `.env.example`;
- `Dockerfile`;
- `docker-compose.yml` validado.

URLs locais:

```text
Frontend: http://localhost:5173
API:      http://localhost:3333
Health:   http://localhost:3333/health
```

Login local demo:

```text
E-mail: demo@operix.local
Senha:  operix123
```

Comandos principais:

```bash
npm install
npm run simulate:ai
npm run typecheck
npm run build
npm run dev:api
npm run dev:web
```

Validacoes ja executadas com sucesso:

```bash
npm install
npm run simulate:ai
npm run typecheck
npm run build
npx prisma generate --schema apps/api/prisma/schema.prisma
docker compose config
```

Endpoints validados:

```text
GET  /health
POST /api/auth/login
GET  /api/auth/me
GET  /api/ai/agents
POST /api/ai/execute
GET  /api/projects
POST /api/projects
GET  /api/files
POST /api/files/mock-upload
GET  /api/conversions/options
GET  /api/logs
```

Modulos locais ativos:

- `auth`: login, registro e sessao JWT em memoria para desenvolvimento.
- `projects`: criacao e listagem de projetos por usuario autenticado.
- `files`: registro de upload simulado para preparar o upload real.
- `conversions`: catalogo de conversoes iniciais, incluindo CAD preparado.

Observacao: o nucleo de IA ainda esta em modo mock deterministico. Ele valida arquitetura, roteamento, logs e custo estimado sem depender de chaves externas. Conectores reais de Ollama, DeepSeek e AWS Bedrock entram nas proximas fases.

Este documento representa a **Fase 1 - Arquitetura**. Nesta fase, o objetivo e organizar a estrutura tecnica antes de continuar a implementacao.

## Estado Atual Do Projeto

O projeto ja esta estruturado como monorepo Node.js com TypeScript.

Estrutura existente nesta fase:

```text
operix-mind/
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   └── src/
│   │       ├── config/
│   │       ├── middleware/
│   │       └── modules/
│   └── web/
│       └── src/
│           ├── components/
│           ├── pages/
│           ├── services/
│           └── styles/
├── local-agent/
│   └── src/
├── packages/
│   ├── ai-agents/
│   │   └── src/
│   │       ├── agent-factory.ts
│   │       ├── agent-types.ts
│   │       ├── bedrock.agent.ts
│   │       ├── context-builder.ts
│   │       ├── deep-claw.agent.ts
│   │       ├── deepseek.agent.ts
│   │       ├── gemma.agent.ts
│   │       ├── index.ts
│   │       ├── ollama.agent.ts
│   │       ├── prompt-router.ts
│   │       └── token-economy.ts
│   └── shared/
│       └── src/
│           └── index.ts
├── scripts/
├── storage/
│   ├── outputs/
│   └── uploads/
├── package.json
└── tsconfig.base.json
```

Observacao: alguns arquivos iniciais do nucleo de agentes ja existem como rascunho tecnico. A Fase 2 devera revisar e consolidar somente os arquivos prioritarios definidos: `deep-claw.agent.ts`, `prompt-router.ts`, `context-builder.ts` e `token-economy.ts`.

## Arquitetura Geral

Fluxo macro:

```text
Usuario
→ Frontend Web
→ Backend API
→ Orquestrador de IA
→ Deep Claw
→ Roteador de Agentes
→ Provedores de IA
→ Logs, Banco, Arquivos e Resposta Final
```

Componentes principais:

- `apps/web`: interface do console SaaS.
- `apps/api`: API principal, autenticacao, arquivos, projetos, logs, filas, integracoes e ponte com agentes.
- `packages/ai-agents`: nucleo independente dos agentes de IA.
- `packages/shared`: tipos, constantes e contratos compartilhados.
- `local-agent`: agente instalado no computador do cliente para execucao local segura.
- `storage`: armazenamento local de desenvolvimento para uploads e saidas.
- `infra`: pasta planejada para Docker, AWS e infraestrutura futura.

## Estrutura De Pastas Alvo

```text
operix-mind/
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── src/
│   │       ├── app.ts
│   │       ├── server.ts
│   │       ├── config/
│   │       │   ├── env.ts
│   │       │   ├── prisma.ts
│   │       │   ├── security.ts
│   │       │   └── storage.ts
│   │       ├── middleware/
│   │       │   ├── auth.middleware.ts
│   │       │   ├── error.middleware.ts
│   │       │   ├── plan.middleware.ts
│   │       │   └── upload.middleware.ts
│   │       └── modules/
│   │           ├── auth/
│   │           ├── users/
│   │           ├── plans/
│   │           ├── projects/
│   │           ├── files/
│   │           ├── conversions/
│   │           ├── documents/
│   │           ├── ai/
│   │           ├── terminal/
│   │           ├── logs/
│   │           ├── queues/
│   │           └── integrations/
│   │               ├── aws/
│   │               ├── github/
│   │               ├── telegram/
│   │               └── cad/
│   │
│   └── web/
│       └── src/
│           ├── app/ ou pages/
│           ├── components/
│           │   ├── console/
│           │   ├── agents/
│           │   ├── files/
│           │   ├── projects/
│           │   ├── terminal/
│           │   └── layout/
│           ├── services/
│           ├── hooks/
│           ├── stores/
│           └── styles/
│
├── packages/
│   ├── ai-agents/
│   │   └── src/
│   │       ├── deep-claw.agent.ts
│   │       ├── deepseek.agent.ts
│   │       ├── gemma.agent.ts
│   │       ├── ollama.agent.ts
│   │       ├── bedrock.agent.ts
│   │       ├── prompt-router.ts
│   │       ├── context-builder.ts
│   │       ├── token-economy.ts
│   │       ├── providers/
│   │       ├── logs/
│   │       └── agent-types.ts
│   │
│   └── shared/
│       └── src/
│           ├── types.ts
│           ├── constants.ts
│           ├── validators.ts
│           └── index.ts
│
├── local-agent/
│   └── src/
│       ├── client/
│       ├── executor/
│       ├── ollama/
│       ├── security/
│       └── logs/
│
├── infra/
│   ├── docker/
│   ├── aws/
│   └── terraform/
├── scripts/
├── storage/
│   ├── uploads/
│   └── outputs/
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── package.json
```

## Modulos Principais

### Backend API

Responsabilidades:

- Autenticacao JWT inicial.
- Preparacao para Cognito no futuro.
- Controle de usuarios e planos.
- Upload e download de arquivos.
- Conversoes de arquivos.
- Projetos e entregaveis gerados.
- Historico de conversas.
- Logs de execucao.
- Chamadas para agentes de IA.
- Terminal controlado.
- Filas para tarefas longas.
- Integracoes com GitHub, Telegram, AWS e CAD.

Arquitetura interna por modulo:

```text
module/
├── controller.ts
├── service.ts
├── repository.ts
├── routes.ts
├── dto.ts
└── types.ts
```

### Frontend Web

Responsabilidades:

- Login.
- Dashboard.
- Console principal de IA.
- Painel lateral de agentes.
- Area de terminal.
- Area de arquivos.
- Area de projetos.
- Configuracoes.
- Exibicao de custo estimado e status dos agentes.

Layout alvo:

```text
Topo:
  abas, projetos abertos, arquivos recentes, configuracoes

Centro:
  console/chat principal

Direita:
  agentes disponiveis, status, modelo, custo, ativar/desativar

Inferior:
  terminal em tempo real e logs de execucao

Lateral/area dedicada:
  arquivos, uploads, conversoes, downloads e historico
```

### Banco De Dados

Banco planejado: PostgreSQL com Prisma.

Entidades principais:

- `User`
- `Plan`
- `Project`
- `FileAsset`
- `ConversionJob`
- `AiConversation`
- `AiMessage`
- `AiExecution`
- `AiAgentCall`
- `TokenUsage`
- `TerminalSession`
- `LogEvent`
- `IntegrationAccount`

### Filas

Inicialmente preparadas para BullMQ com Redis.

Futuro em AWS:

- SQS para filas.
- Lambda para tarefas curtas.
- ECS workers para tarefas longas.

Usos:

- Conversoes.
- OCR.
- Geracao de documentos.
- Chamadas longas de IA.
- Download de projeto pronto.
- Integracoes externas.

## Arquitetura Dos Agentes De IA

O nucleo de IA deve ficar em `packages/ai-agents`.

Os agentes nao devem depender diretamente do Express, do frontend ou do banco. A API chama o nucleo de IA, e o nucleo devolve respostas normalizadas.

Contrato base:

```ts
interface AgentDefinition {
  nome: string;
  funcao: string;
  modelo: string;
  custoEstimadoUsdPor1kTokens: number;
  limiteTokens: number;
  tipoTarefaIdeal: TipoTarefa[];
  promptBase: string;
  regrasResposta: string[];
  execute(request: AgentRequest): Promise<AgentResponse>;
  review(content: string): Promise<AgentResponse>;
  summarize(content: string): Promise<AgentResponse>;
}
```

Agentes previstos:

- `Deep Claw`: coordenador principal.
- `DeepSeek`: raciocinio complexo, arquitetura, debug e revisao.
- `Gemma`: melhoria de prompt, traducao, resumo e documentacao.
- `Ollama Local`: tarefas locais e baratas.
- `AWS Bedrock`: modelos fortes em nuvem.
- `IA Arquiteta`: futura.
- `IA Debugger`: futura.
- `IA DevOps`: futura.
- `IA Documentadora`: futura.

## Comunicacao Entre Agentes

Os agentes nao devem conversar livremente entre si. A comunicacao deve ser orquestrada.

Fluxo:

```text
API
→ AiService
→ Deep Claw
→ Context Builder
→ Prompt Router
→ Agente escolhido
→ Token Economy
→ Logs internos
→ Deep Claw revisa
→ Resposta final
```

Motivos:

- Evita custo descontrolado.
- Evita repeticao de contexto.
- Facilita auditoria.
- Permite trocar provedores.
- Mantem logs claros.

## Fluxo Completo Do Deep Claw

Entrada:

```text
crie um sistema de orcamento
```

Fluxo:

```text
1. Receber pedido bruto do usuario.
2. Enviar pedido para Gemma melhorar o prompt.
3. Traduzir para ingles se o modelo de destino tiver melhor desempenho em ingles.
4. Adicionar contexto tecnico padrao.
5. Estimar tokens e custo.
6. Classificar intencao:
   - sistema
   - debug
   - documento
   - proposta
   - dashboard
   - conversao
   - automacao
7. Criar plano de execucao.
8. Dividir tarefas:
   - frontend
   - backend
   - banco
   - autenticacao
   - documentos
   - deploy
   - testes
9. Escolher agentes por tarefa.
10. Montar contexto compacto por agente.
11. Executar agentes selecionados.
12. Coletar respostas parciais.
13. Revisar com Deep Claw ou DeepSeek.
14. Solicitar correcao se houver inconsistencias.
15. Consolidar resposta final em portugues do Brasil.
16. Registrar logs, tokens, custo e entregaveis.
```

Saida esperada:

- Plano tecnico.
- Tarefas divididas.
- Resultado consolidado.
- Logs de decisao.
- Custo estimado.
- Proximos passos.

## Estrategia De Economia De Tokens

Arquivo central:

```text
packages/ai-agents/src/token-economy.ts
```

Funcoes planejadas:

```ts
estimateTokens(text)
summarizeContext(content)
selectCheapestCapableModel(agents, taskType)
trimPrompt(prompt, maxTokens)
buildCompactContext(files)
logTokenUsage(log)
```

Regras:

- Nao enviar projeto inteiro para IA sem necessidade.
- Enviar somente arquivos relevantes.
- Resumir arquivos grandes antes de chamar modelos caros.
- Usar Gemma/Ollama para resumo, traducao e preparacao.
- Usar DeepSeek/Bedrock somente em tarefas criticas.
- Criar contexto especifico por tarefa.
- Guardar historico resumido de conversa.
- Registrar tokens por chamada.
- Registrar custo estimado por usuario, projeto e agente.
- Aplicar limites por plano.

Modelo de log:

```text
agentName
model
taskType
estimatedTokens
estimatedCostUsd
userId
projectId
createdAt
```

## Prompt Builder Com Gemma

Arquivo central:

```text
packages/ai-agents/src/context-builder.ts
```

Fluxo:

```text
Pedido simples em portugues
→ Gemma melhora clareza
→ Gemma remove ambiguidades
→ Gemma traduz se necessario
→ Context Builder adiciona contexto tecnico
→ Deep Claw planeja execucao
```

Funcoes planejadas:

```ts
improveUserPrompt(input)
translatePromptToEnglish(prompt)
addTechnicalContext(prompt)
createTaskContext(request)
formatFinalAnswerPortuguese(content)
```

Exemplo:

Entrada:

```text
cria um sistema de orcamento com login e painel
```

Prompt melhorado:

```text
Crie uma aplicacao SaaS de orcamentos com login, painel administrativo,
cadastro de clientes, cadastro de itens, criacao de propostas, calculo de
valores, exportacao em PDF, controle de usuarios e arquitetura modular.
Inclua frontend, backend, banco de dados, autenticacao, Docker, README e
instrucoes de execucao.
```

## Integracao Com Ollama Local

Ollama sera usado para reduzir custo, aumentar privacidade e permitir execucao offline parcial.

Modos:

### Modo API Local

```text
Backend API
→ OLLAMA_BASE_URL
→ modelo local
→ resposta normalizada
```

Variaveis:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=gemma2:9b
```

### Modo Agente Local

```text
Frontend Web
→ Backend API
→ canal seguro
→ Local Agent no computador do cliente
→ Ollama local
→ resposta volta para API
→ frontend mostra resultado
```

Responsabilidades do `local-agent`:

- Executar comandos permitidos.
- Chamar Ollama local.
- Registrar logs locais.
- Validar permissoes.
- Bloquear comandos perigosos.
- Sincronizar status com a API.

Comandos perigosos bloqueados por padrao:

```text
rm -rf
git reset --hard
docker system prune
shutdown
reboot
format
del /s
```

## Preparacao Para AWS Bedrock

Bedrock deve ser implementado como provider isolado.

Camada planejada:

```text
packages/ai-agents/src/bedrock.agent.ts
apps/api/src/modules/integrations/aws/
```

Variaveis planejadas:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BEDROCK_MODEL_ID=
AWS_S3_BUCKET=
DATABASE_URL=
```

Servicos AWS previstos:

- `Bedrock`: modelos de IA em nuvem.
- `S3`: uploads, outputs, downloads e projetos gerados.
- `RDS PostgreSQL`: banco de producao.
- `ECS ou EC2`: API e workers.
- `Lambda`: tarefas assicronas leves.
- `SQS`: filas em producao.
- `CloudWatch`: logs e metricas.
- `Cognito`: autenticacao futura.

Regra arquitetural:

```text
Codigo da aplicacao
→ AiProvider
→ BedrockProvider
→ resposta normalizada
```

Assim, o sistema nao fica preso a um unico modelo.

## Planos E Limites

Planos previstos:

- `Gratis`: uso limitado, IA basica e conversoes simples.
- `Pro`: mais conversoes, relatorios, propostas e dashboards.
- `Engenharia`: PDF/DWG, memoriais, listas de materiais e propostas tecnicas.
- `Dev`: console programador, GitHub, terminal e geracao de codigo.
- `Empresa`: multiagentes, agente local, Telegram, automacoes e AWS Bedrock.

Controle por plano:

- Limite diario de mensagens.
- Limite mensal de tokens.
- Limite de tamanho de upload.
- Conversoes permitidas.
- Agentes disponiveis.
- Integracoes disponiveis.

## Seguranca

Regras obrigatorias:

- Nunca expor secrets no frontend.
- Usar `.env` para chaves.
- Validar uploads.
- Limitar tamanho dos arquivos.
- Bloquear comandos destrutivos.
- Exigir confirmacao para comandos sensiveis.
- Registrar logs de execucao.
- Separar ambiente do cliente.
- Aplicar permissoes por plano.
- Preparar migracao futura para Cognito.

## Fases De Desenvolvimento

### Fase 1 - Arquitetura

Status: em andamento.

Entregas:

- Analise da estrutura atual.
- Definicao da arquitetura.
- Documentacao no README.
- Sem implementacao funcional nova.

### Fase 2 - Nucleo De IA

Implementar apenas:

- `deep-claw.agent.ts`
- `prompt-router.ts`
- `context-builder.ts`
- `token-economy.ts`

Validar:

- Logs internos.
- Decisao de agente.
- Estimativa de tokens.
- Fluxo modular.

### Fase 3 - Teste Do Fluxo

Simular:

```text
crie um sistema de orcamento
```

Validar:

- Melhorar prompt.
- Traduzir.
- Planejar.
- Dividir tarefas.
- Gerar resposta.
- Mostrar logs detalhados.

### Fase 4 - Backend Base

Criar:

- API Node.js com TypeScript.
- Estrutura de servicos.
- Integracao inicial com agentes.
- Sistema de logs.

### Fase 5 - Estrutura Frontend

Criar:

- Layout do console.
- Painel lateral de IAs.
- Area de terminal.
- Area de arquivos.

### Fase 6 - Documentacao Final

Atualizar:

- Como instalar.
- Como rodar.
- Como testar.
- Estrutura final.
- Proximos passos.

## Criterio Para Avancar De Fase

Uma fase so deve ser considerada concluida quando:

- A estrutura prevista estiver clara.
- A validacao da fase nao apontar erro.
- O README estiver atualizado quando necessario.
- Nao houver implementacao fora do escopo da fase.
- O resultado estiver em portugues do Brasil.
