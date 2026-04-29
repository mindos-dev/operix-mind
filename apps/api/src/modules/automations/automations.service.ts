import { randomUUID } from 'node:crypto';
import { addLog } from '../logs/logs.service.js';

export interface AutomationFlow {
  id: string;
  titulo: string;
  descricao: string;
  entrada: 'arquivo' | 'texto' | 'codigo' | 'conversa' | 'planilha';
  saida: string;
  usaGemma: boolean;
  premium: boolean;
}

export const automationFlows: AutomationFlow[] = [
  { id: 'pdf-orcamento', titulo: 'PDF → Orçamento', descricao: 'Transformar PDF em orçamento estruturado.', entrada: 'arquivo', saida: 'Planilha e PDF', usaGemma: true, premium: true },
  { id: 'projeto-proposta', titulo: 'Projeto → Proposta', descricao: 'Gerar proposta comercial a partir de dados de projeto.', entrada: 'texto', saida: 'Documento', usaGemma: true, premium: true },
  { id: 'planilha-dashboard', titulo: 'Planilha → Dashboard', descricao: 'Criar dashboard a partir de dados tabulares.', entrada: 'planilha', saida: 'Dashboard', usaGemma: true, premium: false },
  { id: 'texto-relatorio', titulo: 'Texto → Relatório', descricao: 'Gerar relatório técnico automático.', entrada: 'texto', saida: 'Relatório', usaGemma: true, premium: false },
  { id: 'conversa-documento', titulo: 'Conversa → Documento', descricao: 'Transformar conversa em documento organizado.', entrada: 'conversa', saida: 'Documento', usaGemma: true, premium: false },
  { id: 'codigo-sistema', titulo: 'Código → Sistema', descricao: 'Analisar código e planejar sistema limpo.', entrada: 'codigo', saida: 'Projeto', usaGemma: true, premium: true },
  { id: 'atendimento-resposta', titulo: 'Atendimento → Resposta automática', descricao: 'Gerar resposta padronizada para atendimento.', entrada: 'texto', saida: 'Mensagem', usaGemma: true, premium: false },
  { id: 'memorial-descritivo', titulo: 'Gerar memorial descritivo', descricao: 'Criar memorial técnico a partir de texto ou arquivo.', entrada: 'arquivo', saida: 'Memorial', usaGemma: true, premium: true },
  { id: 'lista-materiais', titulo: 'Gerar lista de materiais', descricao: 'Extrair itens e quantidades em formato tabular.', entrada: 'arquivo', saida: 'Planilha', usaGemma: true, premium: true },
  { id: 'documentacao-tecnica', titulo: 'Gerar documentação técnica', descricao: 'Gerar documentação técnica para projeto ou código.', entrada: 'texto', saida: 'README/Documento', usaGemma: true, premium: false }
];

export function listAutomationFlows() {
  return automationFlows;
}

export function runAutomation(input: { userId: string; flowId: string; texto?: string }) {
  const flow = automationFlows.find((item) => item.id === input.flowId);
  if (!flow) throw new Error('Automação não encontrada.');

  const execution = {
    id: randomUUID(),
    flowId: flow.id,
    status: 'concluido',
    aviso: flow.premium ? 'Esta ação usa IA premium.' : 'Esta ação usa IA econômica/padrão.',
    etapas: [
      'Entrada recebida',
      'Gemma otimizou o prompt e reduziu contexto',
      'Roteador selecionou a IA adequada',
      'Resultado mock gerado para download futuro'
    ],
    criadoEm: new Date().toISOString()
  };

  addLog({ level: 'sucesso', origem: 'automations', mensagem: 'Automação executada em modo mock.', detalhes: { execution, flow } });
  return execution;
}
