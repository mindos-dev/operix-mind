import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './app.js';

async function withServer(fn: (baseUrl: string) => Promise<void>) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Não foi possível iniciar o servidor de teste.');
  }

  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    await fn(baseUrl);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

async function json<T>(url: string, init?: RequestInit): Promise<{ status: number; body: T }> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init
  });
  return {
    status: response.status,
    body: await response.json().catch(() => ({} as T))
  };
}

test('auth register issues tokens and keeps password hashed', async () => {
  await withServer(async (baseUrl) => {
    const result = await json<{ dados: { usuario: { email: string }; token: string; accessToken: string; refreshToken: string } }>(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ nome: 'Usuário Teste', email: 'teste.security@mind.local', senha: 'SenhaForte123' })
    });

    assert.equal(result.status, 201);
    assert.equal(result.body.dados.usuario.email, 'teste.security@mind.local');
    assert.ok(result.body.dados.accessToken);
    assert.ok(result.body.dados.refreshToken);
    assert.ok(result.body.dados.token);
  });
});

test('protects routes without authentication', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/projects`);
    assert.equal(response.status, 401);
  });
});

test('rejects weak passwords and invalid input', async () => {
  await withServer(async (baseUrl) => {
    const result = await json<{ mensagem: string }>(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ nome: 'A', email: 'invalid', senha: '123' })
    });

    assert.equal(result.status, 400);
    assert.match(result.body.mensagem, /Dados inválidos|Informe/i);
  });
});

test('blocks premium AI for non-enterprise users and protects logs', async () => {
  await withServer(async (baseUrl) => {
    const register = await json<{ dados: { accessToken: string } }>(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ nome: 'Usuário Base', email: 'base.security@mind.local', senha: 'SenhaForte123' })
    });

    const headers = {
      Authorization: `Bearer ${register.body.dados.accessToken}`
    };

    const premium = await json<{ mensagem: string }>(`${baseUrl}/api/ai/premium/estimate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt: 'crie um relatório técnico premium' })
    });

    assert.equal(premium.status, 403);

    const logs = await fetch(`${baseUrl}/api/logs`, { headers });
    assert.equal(logs.status, 403);
  });
});

