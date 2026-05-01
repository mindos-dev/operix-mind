import fs from 'node:fs';
import path from 'node:path';

const bridgePath = process.env.BRIDGE_PATH || '/home/aleixo/july_bridge';

export async function sendBridgeInstruction(data: Record<string, unknown>) {
  if (process.env.BRIDGE_ENABLED !== 'true') {
    return { status: 'disabled', message: 'Bridge não habilitado.' };
  }

  fs.mkdirSync(bridgePath, { recursive: true });

  const filePath = path.join(bridgePath, 'instruction.json');

  fs.writeFileSync(
    filePath,
    JSON.stringify({ ...data, createdAt: new Date().toISOString() }, null, 2),
    'utf-8'
  );

  return { status: 'sent', instructionFile: filePath };
}
