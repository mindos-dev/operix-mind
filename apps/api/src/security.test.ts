import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createApp } from './app.js';
import { getPrismaClient } from './db/prisma.js';
import { decryptSecret, encryptSecret, maskSecret } from './modules/security/secret-vault.service.js';

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
  const { headers: initHeaders, ...rest } = init || {};
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(initHeaders || {}) },
    ...rest
  });
  return {
    status: response.status,
    body: await response.json().catch(() => ({} as T))
  };
}

async function withTelegramMock(fn: (baseUrl: string) => Promise<void>) {
  const originalFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.startsWith('https://api.telegram.org')) {
      if (url.includes('/getMe')) {
        return new Response(JSON.stringify({
          ok: true,
          result: { id: 123456, is_bot: true, first_name: 'Mind Bot', username: 'mind_ia_bot' }
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (url.includes('/setWebhook') || url.includes('/deleteWebhook') || url.includes('/sendMessage')) {
        return new Response(JSON.stringify({ ok: true, result: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (url.includes('/getFile')) {
        return new Response(JSON.stringify({
          ok: true,
          result: { file_id: 'file-1', file_unique_id: 'unique-1', file_size: 8, file_path: 'files/sample.txt' }
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (url.includes('/file/bot')) {
        return new Response('telegram-file', { status: 200 });
      }

      return new Response(JSON.stringify({ ok: false }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    return originalFetch(input as RequestInfo | URL, init);
  }) as typeof fetch;

  try {
    await fn('http://127.0.0.1');
  } finally {
    globalThis.fetch = originalFetch;
  }
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

test('bootstrap admin login is separated from regular users', async () => {
  await withServer(async (baseUrl) => {
    const adminLogin = await json<{ dados: { usuario: { email: string; role: string }; accessToken: string } }>(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@mind.local', senha: 'MindAdmin123!' })
    });

    assert.equal(adminLogin.status, 200);
    assert.equal(adminLogin.body.dados.usuario.role, 'admin');

    const adminMe = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${adminLogin.body.dados.accessToken}` }
    });

    assert.equal(adminMe.status, 200);
  });
});

test('each login only sees its own projects, files and export data', async () => {
  await withServer(async (baseUrl) => {
    const admin = await json<{ dados: { accessToken: string } }>(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@mind.local', senha: 'MindAdmin123!' })
    });
    const demo = await json<{ dados: { accessToken: string } }>(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'demo@operix.local', senha: 'operix123' })
    });

    const adminHeaders = { Authorization: `Bearer ${admin.body.dados.accessToken}` };
    const demoHeaders = { Authorization: `Bearer ${demo.body.dados.accessToken}` };

    const adminProject = await json<{ dados: { id: string; nome: string } }>(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ nome: 'Projeto Admin', descricao: 'Somente admin deve ver' })
    });
    assert.equal(adminProject.status, 201);

    const demoFile = await json<{ dados: { id: string; nomeOriginal: string } }>(`${baseUrl}/api/files/mock-upload`, {
      method: 'POST',
      headers: demoHeaders,
      body: JSON.stringify({ nomeOriginal: 'demo.pdf', tamanhoBytes: 1234 })
    });
    assert.equal(demoFile.status, 201);

    const demoProjects = await json<{ dados: Array<{ nome: string }> }>(`${baseUrl}/api/projects`, {
      headers: demoHeaders
    });
    assert.equal(demoProjects.body.dados.some((project) => project.nome === 'Projeto Admin'), false);

    const adminFiles = await json<{ dados: Array<{ nomeOriginal: string }> }>(`${baseUrl}/api/files`, {
      headers: adminHeaders
    });
    assert.equal(adminFiles.body.dados.some((file) => file.nomeOriginal === 'demo.pdf'), false);

    const adminExport = await json<{ dados: { projects: Array<{ nome: string }>; files: Array<{ nomeOriginal: string }> } }>(`${baseUrl}/api/privacy/export`, {
      headers: adminHeaders
    });
    assert.equal(adminExport.body.dados.projects.some((project) => project.nome === 'Projeto Admin'), true);
    assert.equal(adminExport.body.dados.files.some((file) => file.nomeOriginal === 'demo.pdf'), false);
  });
});

test('auth refresh token can be read from secure cookie', async () => {
  await withServer(async (baseUrl) => {
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: 'Cookie Teste', email: 'cookie.security@mind.local', senha: 'SenhaForte123' })
    });

    assert.equal(registerResponse.status, 201);
    const setCookie = registerResponse.headers.get('set-cookie');
    assert.ok(setCookie);
    const cookieHeader = setCookie.split(';')[0];

    const refreshResponse = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:5173',
        Cookie: cookieHeader
      },
      body: JSON.stringify({})
    });

    assert.equal(refreshResponse.status, 200);
  });
});

test('exposes oauth providers and rejects invalid provider', async () => {
  await withServer(async (baseUrl) => {
    const providers = await fetch(`${baseUrl}/api/auth/oauth/providers`);
    assert.equal(providers.status, 200);

    const invalid = await fetch(`${baseUrl}/api/auth/oauth/invalid/start`);
    assert.equal(invalid.status, 400);
  });
});

test('oauth start falls back to local demo callback and completes session', async () => {
  await withServer(async (baseUrl) => {
    const startResponse = await fetch(`${baseUrl}/api/auth/oauth/google/start?redirectUri=${encodeURIComponent('http://localhost:5173/oauth/callback')}`);
    assert.equal(startResponse.status, 200);
    const startBody = await startResponse.json();
    assert.match(String(startBody.dados.url), /mock=1/);

    const callbackResponse = await fetch(`${baseUrl}/api/auth/oauth/google/callback?mock=1&provider=google&state=test-state`, {
      headers: {
        Origin: 'http://localhost:5173'
      }
    });

    assert.equal(callbackResponse.status, 200);
    const callbackBody = await callbackResponse.json();
    assert.equal(callbackBody.dados.provider, 'google');
    assert.ok(callbackBody.dados.accessToken);
    assert.ok(callbackResponse.headers.get('set-cookie'));
  });
});

test('admin can toggle oauth provider availability', async () => {
  await withServer(async (baseUrl) => {
    const register = await json<{ dados: { accessToken: string } }>(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ nome: 'Admin Teste', email: 'admin.oauth@mind.local', senha: 'SenhaForte123', role: 'admin' })
    });

    const providers = await fetch(`${baseUrl}/api/auth/oauth/providers`);
    const providersBody = await providers.json() as { dados: Array<{ provider: string; enabled: boolean }> };
    const githubBefore = providersBody.dados.find((item) => item.provider === 'github');
    assert.ok(githubBefore);
    const originalEnabled = githubBefore.enabled;

    try {
      const toggle = await fetch(`${baseUrl}/api/auth/oauth/providers/github`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${register.body.dados.accessToken}`
        },
        body: JSON.stringify({ enabled: false })
      });

      assert.equal(toggle.status, 200);
      const toggleBody = await toggle.json();
      assert.equal(toggleBody.dados.provider, 'github');
      assert.equal(toggleBody.dados.enabled, false);
      assert.equal(toggleBody.dados.source, 'admin');

      const afterToggle = await fetch(`${baseUrl}/api/auth/oauth/providers`);
      const afterToggleBody = await afterToggle.json() as { dados: Array<{ provider: string; enabled: boolean }> };
      const github = afterToggleBody.dados.find((item) => item.provider === 'github');
      assert.ok(github);
      assert.equal(github.enabled, false);

      const overridesPath = path.resolve(process.cwd(), 'storage', 'oauth-provider-overrides.json');
      const overridesRaw = await readFile(overridesPath, 'utf8');
      const overrides = JSON.parse(overridesRaw) as { github?: { enabled: boolean; updatedBy?: string } };
      assert.equal(overrides.github?.enabled, false);
      assert.equal(overrides.github?.updatedBy, 'admin.oauth@mind.local');

      const reset = await fetch(`${baseUrl}/api/auth/oauth/providers/github/override`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${register.body.dados.accessToken}`
        }
      });

      assert.equal(reset.status, 200);
      const resetBody = await reset.json();
      assert.equal(resetBody.dados.provider, 'github');
      assert.equal(resetBody.dados.source, 'env');

      const resetProviders = await fetch(`${baseUrl}/api/auth/oauth/providers`);
      const resetProvidersBody = await resetProviders.json() as { dados: Array<{ provider: string; enabled: boolean; source: string }> };
      const githubReset = resetProvidersBody.dados.find((item) => item.provider === 'github');
      assert.ok(githubReset);
      assert.equal(githubReset.source, 'env');
      assert.equal(githubReset.enabled, originalEnabled);

      const overridesAfterReset = JSON.parse(await readFile(overridesPath, 'utf8')) as { github?: unknown };
      assert.equal(overridesAfterReset.github, undefined);

      const disableGoogle = await fetch(`${baseUrl}/api/auth/oauth/providers/google`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${register.body.dados.accessToken}`
        },
        body: JSON.stringify({ enabled: false })
      });
      assert.equal(disableGoogle.status, 200);

      const summaryBeforeResetAll = await fetch(`${baseUrl}/api/auth/oauth/summary`);
      const summaryBeforeResetAllBody = await summaryBeforeResetAll.json() as { dados: { overridden: number; disabled: number } };
      assert.ok(summaryBeforeResetAllBody.dados.overridden >= 1);

      const resetAll = await fetch(`${baseUrl}/api/auth/oauth/reset-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${register.body.dados.accessToken}`
        },
        body: JSON.stringify({ confirmed: true })
      });

      assert.equal(resetAll.status, 200);
      const resetAllBody = await resetAll.json();
      assert.ok(Array.isArray(resetAllBody.dados.providers));
      assert.equal(resetAllBody.dados.providers.every((provider: { source: string }) => provider.source === 'env'), true);

      const summaryAfterResetAll = await fetch(`${baseUrl}/api/auth/oauth/summary`);
      const summaryAfterResetAllBody = await summaryAfterResetAll.json() as { dados: { overridden: number; disabled: number } };
      assert.equal(summaryAfterResetAllBody.dados.overridden, 0);
    } finally {
      await fetch(`${baseUrl}/api/auth/oauth/providers/github`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${register.body.dados.accessToken}`
        },
        body: JSON.stringify({ enabled: originalEnabled })
      });
    }
  });
});

test('admin can export oauth diagnostics', async () => {
  await withServer(async (baseUrl) => {
    const register = await json<{ dados: { accessToken: string } }>(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ nome: 'Admin Export', email: 'admin.export@mind.local', senha: 'SenhaForte123', role: 'admin' })
    });

    const diagnostics = await fetch(`${baseUrl}/api/auth/oauth/export`, {
      headers: {
        Authorization: `Bearer ${register.body.dados.accessToken}`
      }
    });

    assert.equal(diagnostics.status, 200);
    const diagnosticsBody = await diagnostics.json() as { dados: { generatedAt: string; summary: { totalProviders: number }; providers: Array<{ provider: string }> } };
    assert.ok(diagnosticsBody.dados.generatedAt);
    assert.equal(diagnosticsBody.dados.summary.totalProviders, 3);
    assert.ok(Array.isArray(diagnosticsBody.dados.providers));
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

test('telegram connect validates token and creates pairing session', async () => {
  await withTelegramMock(async () => {
    await withServer(async (baseUrl) => {
      const admin = await json<{ dados: { accessToken: string } }>(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email: 'admin@mind.local', senha: 'MindAdmin123!' })
      });

      const connect = await json<{ dados: { integrationId: string; pairingCode: string; deepLink: string; qrCodeDataUrl: string; status: string } }>(`${baseUrl}/api/integrations/telegram/connect`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${admin.body.dados.accessToken}` },
        body: JSON.stringify({ botToken: '123456:telegram-valid-token' })
      });

      assert.equal(connect.status, 201);
      assert.ok(connect.body.dados.integrationId);
      assert.ok(connect.body.dados.pairingCode);
      assert.match(connect.body.dados.deepLink, /t\.me\/mind_ia_bot\?start=/);
      assert.match(connect.body.dados.qrCodeDataUrl, /^data:image\/png;base64,/);
    });
  });
});

test('telegram webhook rejects invalid secret and activates pairing with start command', async () => {
  await withTelegramMock(async () => {
    await withServer(async (baseUrl) => {
      const admin = await json<{ dados: { accessToken: string } }>(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email: 'admin@mind.local', senha: 'MindAdmin123!' })
      });

      const connect = await json<{ dados: { integrationId: string; pairingCode: string } }>(`${baseUrl}/api/integrations/telegram/connect`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${admin.body.dados.accessToken}` },
        body: JSON.stringify({ botToken: '123456:telegram-valid-token' })
      });

      const invalidWebhook = await fetch(`${baseUrl}/telegram/webhook/invalid-secret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      assert.equal(invalidWebhook.status, 404);

      const secretStatus = await fetch(`${baseUrl}/api/integrations/telegram/status`, {
        headers: { Authorization: `Bearer ${admin.body.dados.accessToken}` }
      });
      const secretBody = await secretStatus.json() as { dados: Array<{ id: string; botUsername: string; status: string }> };
      const telegram = secretBody.dados.find((item) => item.id === connect.body.dados.integrationId);
      assert.ok(telegram);

      const prisma = getPrismaClient();
      if (prisma) {
        const dbIntegration = await prisma.telegramIntegration.findUnique({
          where: { id: connect.body.dados.integrationId }
        });
        assert.ok(dbIntegration);
        assert.ok(dbIntegration.encryptedBotToken);
        assert.equal(dbIntegration.encryptedBotToken.includes('telegram-valid-token'), false);

        const webhookResponse = await fetch(`${baseUrl}/telegram/webhook/${dbIntegration.webhookSecret}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: {
              message_id: 1,
              chat: { id: 999999 },
              from: { id: 555555 },
              text: `/start ${connect.body.dados.pairingCode}`
            }
          })
        });
        assert.equal(webhookResponse.status, 200);

        const refreshedStatus = await fetch(`${baseUrl}/api/integrations/telegram/status`, {
          headers: { Authorization: `Bearer ${admin.body.dados.accessToken}` }
        });
        const refreshedStatusBody = await refreshedStatus.json() as { dados: Array<{ id: string; status: string; chatId?: string }> };
        const activeTelegram = refreshedStatusBody.dados.find((item) => item.id === connect.body.dados.integrationId);
        assert.ok(activeTelegram);
        assert.equal(activeTelegram?.status, 'active');
        assert.equal(activeTelegram?.chatId, '999999');
      }
    });
  });
});

test('setup status and health endpoints stay safe', async () => {
  await withServer(async (baseUrl) => {
    const setupStatus = await fetch(`${baseUrl}/api/setup/status`);
    assert.equal(setupStatus.status, 200);
    const setupBody = await setupStatus.json() as { dados: { database: { configured: boolean }; locked: boolean } };
    assert.equal(typeof setupBody.dados.database.configured, 'boolean');

    const health = await fetch(`${baseUrl}/health/full`);
    assert.equal(health.status, 200);
    const healthBody = await health.json() as { env: Record<string, unknown> };
    assert.equal(Object.keys(healthBody.env).includes('secretEncryptionKey'), false);
  });
});

test('api keys can be created and are not exposed in full', async () => {
  await withServer(async (baseUrl) => {
    const admin = await json<{ dados: { accessToken: string } }>(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@mind.local', senha: 'MindAdmin123!' })
    });

    const created = await json<{ dados: { record: { id: string; keyPrefix: string }; apiKey: string } }>(`${baseUrl}/api/api-keys`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${admin.body.dados.accessToken}` },
      body: JSON.stringify({ name: 'CI key', scopes: ['projects:read'] })
    });

    assert.equal(created.status, 201);
    assert.ok(created.body.dados.apiKey.startsWith('opx_'));

    const listed = await json<{ dados: Array<{ id: string; keyPrefix: string }> }>(`${baseUrl}/api/api-keys`, {
      headers: { Authorization: `Bearer ${admin.body.dados.accessToken}` }
    });
    assert.equal(listed.body.dados.some((key) => key.id === created.body.dados.record.id), true);
  });
});

test('secret vault encrypts, decrypts and masks values', async () => {
  const cipher = encryptSecret('super-secret-value');
  assert.equal(cipher.includes('super-secret-value'), false);
  assert.equal(decryptSecret(cipher), 'super-secret-value');
  assert.equal(maskSecret('1234567890').includes('123'), true);
});
