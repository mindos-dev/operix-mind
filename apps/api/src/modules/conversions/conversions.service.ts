import { randomUUID } from 'node:crypto';
import { addLog } from '../logs/logs.service.js';
import {
  buildConversionMatrix,
  conversionCapabilities,
  conversionPlugins,
  findPluginByName,
  type ConversionCategory
} from './conversion-catalog.js';

export interface ConversionOption {
  id: string;
  origem: string;
  destino: string;
  categoria: ConversionCategory;
  status: 'ativo' | 'preparado';
  descricao: string;
  engines: string[];
  plugin: string;
  premium?: boolean;
  requerBinarioLocal?: boolean;
  requerCredencial?: boolean;
}

export interface ConversionJob {
  id: string;
  optionId: string;
  userId: string;
  status: 'fila' | 'processando' | 'concluido';
  plugin: string;
  engines: string[];
  resultado: string;
  criadoEm: string;
}

export const conversionOptions: ConversionOption[] = conversionCapabilities;

const jobs: ConversionJob[] = [];

export function listConversionOptions() {
  return conversionOptions;
}

export function listConversionPlugins() {
  return conversionPlugins.map((plugin) => ({
    nome: plugin.nome,
    software: plugin.software,
    comandos: plugin.comandos,
    requerCredencial: Boolean(plugin.requerCredencial),
    requerBinarioLocal: Boolean(plugin.requerBinarioLocal)
  }));
}

export function listConversionMatrix() {
  return buildConversionMatrix();
}

export function createConversionJob(input: { userId: string; optionId: string }) {
  const option = conversionOptions.find((item) => item.id === input.optionId);
  if (!option) throw new Error('Conversão não encontrada.');

  const job: ConversionJob = {
    id: randomUUID(),
    optionId: option.id,
    userId: input.userId,
    status: 'concluido',
    plugin: option.plugin,
    engines: option.engines,
    resultado: findPluginByName(option.plugin)
      ? `${option.destino} gerado em modo mock por ${option.plugin}.`
      : `${option.destino} preparado para processamento externo.`,
    criadoEm: new Date().toISOString()
  };

  jobs.unshift(job);
  addLog({ level: 'sucesso', origem: 'conversions', mensagem: 'Conversão simulada concluída.', detalhes: { job, option } });
  return job;
}

export function listConversionJobs(userId: string) {
  return jobs.filter((job) => job.userId === userId);
}
