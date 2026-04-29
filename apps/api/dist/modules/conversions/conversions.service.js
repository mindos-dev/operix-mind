import { randomUUID } from 'node:crypto';
import { addLog } from '../logs/logs.service.js';
import { buildConversionMatrix, conversionCapabilities, conversionPlugins, findPluginByName } from './conversion-catalog.js';
export const conversionOptions = conversionCapabilities;
const jobs = [];
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
export function createConversionJob(input) {
    const option = conversionOptions.find((item) => item.id === input.optionId);
    if (!option)
        throw new Error('Conversão não encontrada.');
    const job = {
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
export function listConversionJobs(userId) {
    return jobs.filter((job) => job.userId === userId);
}
