import { classifyDevice } from './device-capability.service.js';
import { classifyTaskComplexity } from './task-complexity.service.js';
import { checkUserLimit, estimateRuntimeCost, getPlanLimit } from './runtime-cost.service.js';
import { fallbackFor, isBedrockAllowed } from './runtime-policy.js';
import type { DeviceProfile, RuntimeChoice, RuntimeDecision, RuntimeTask, UserPlan } from './runtime.types.js';

export function decideRuntime(task: RuntimeTask, device: DeviceProfile, userPlan: UserPlan): RuntimeDecision {
  const deviceClass = classifyDevice(device);
  const complexity = classifyTaskComplexity(task);
  let runtime: RuntimeChoice = 'api_barata';
  let motivo = 'API barata escolhida para equilibrar custo e velocidade.';

  if (complexity === 'simples' && deviceClass !== 'low' && (device.modoEconomia || device.suportaWasm)) {
    runtime = 'local';
    motivo = 'Tarefa simples roteada para IA local com otimização Gemma e custo zero.';
  } else if (complexity === 'simples') {
    runtime = 'api_barata';
    motivo = 'Tarefa simples em dispositivo limitado: API barata evita travamento local.';
  } else if (complexity === 'media') {
    runtime = 'api_barata';
    motivo = 'Tarefa média: API barata resolve com baixo custo e resposta rápida.';
  } else if (complexity === 'complexa') {
    runtime = 'cloud_forte';
    motivo = 'Tarefa complexa exige modelo cloud forte para análise técnica, código ou relatório.';
  } else if (complexity === 'critica' && isBedrockAllowed(userPlan)) {
    runtime = 'bedrock_premium';
    motivo = 'Tarefa crítica com plano Enterprise habilitado para Bedrock premium.';
  } else if (complexity === 'critica') {
    runtime = 'cloud_forte';
    motivo = 'Tarefa crítica, mas Bedrock só está liberado para Enterprise; usando cloud forte.';
  }

  const custoEstimadoUsd = estimateRuntimeCost(runtime, task.tokensEstimados);
  const limitePlanoUsd = getPlanLimit(userPlan);
  const permitido = checkUserLimit(userPlan, runtime, custoEstimadoUsd);

  return {
    runtime,
    motivo,
    custoEstimadoUsd,
    tokensEstimados: task.tokensEstimados,
    limitePlanoUsd,
    risco: runtime === 'local' ? 'baixo' : runtime === 'bedrock_premium' ? 'alto' : 'medio',
    fallback: fallbackFor(runtime),
    modeloSugerido: modelFor(runtime),
    classeDispositivo: deviceClass,
    complexidade: complexity,
    bloqueado: !permitido,
    mensagem: permitido ? undefined : 'Esta tarefa exige outro plano ou ultrapassa o limite de custo configurado.'
  };
}

function modelFor(runtime: RuntimeChoice): string {
  if (runtime === 'local') return 'gemma2:9b via Ollama';
  if (runtime === 'api_barata') return 'DeepSeek/Qwen econômico';
  if (runtime === 'cloud_forte') return 'DeepSeek Reasoner';
  return 'AWS Bedrock premium';
}
