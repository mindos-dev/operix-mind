const comandosBloqueados = [
  'rm -rf',
  'git reset --hard',
  'docker system prune',
  'shutdown',
  'reboot',
  'format',
  'del /s'
];

export function isCommandAllowed(command: string): boolean {
  const normalized = command.toLowerCase();
  return !comandosBloqueados.some((blocked) => normalized.includes(blocked));
}

console.log('Agente local Mind_IA preparado. Execução remota será conectada em fase futura.');
