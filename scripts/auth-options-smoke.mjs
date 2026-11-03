import { _electron as electron, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import os from 'node:os';
const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'meldiq-auth-options-'));
const info = JSON.parse(await fs.readFile('packages/web/test/contract-fixtures/http/GET_v1_server-info.json', 'utf8'));
info.passkeys = { webOrigins: ['https://web.meldiq.app'] };
let available = false;
const server = http.createServer((req, res) => {
  res.setHeader('content-type', 'application/json');
  if (req.method === 'HEAD') { res.end(); return; }
  if (!available) { res.statusCode = 503; res.end(JSON.stringify({ error: { code: 'unavailable', message: 'Isolated availability test' } })); return; }
  if (req.url === '/v1/server-info') { res.end(JSON.stringify(info)); return; }
  if (req.url === '/v2/auth/social/config') { res.end(JSON.stringify({ providers: ['google', 'discord'], googleClientId: null })); return; }
  res.statusCode = 404; res.end('{}');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let client;
try {
  client = await electron.launch({ args: ['.'], env: { ...process.env, MELDIQ_TEST_USER_DATA: profile, MELDIQ_TEST_API_ORIGIN: base }, timeout: 60_000 });
  const page = await client.firstWindow();
  await expect(page.getByRole('button', { name: 'Continue with email', exact: true })).toBeVisible();
  await expect(page.getByText('Could not check all sign-in methods. Refresh options to try again.', { exact: true }).first()).toBeVisible();
  available = true;
  const count = await page.getByRole('button', { name: 'Refresh', exact: true }).count();
  for (let i = count; i > 0; i--) {
    await page.getByRole('button', { name: 'Refresh', exact: true }).first().click();
    await expect.poll(() => page.getByRole('button', { name: 'Refresh', exact: true }).count()).toBeLessThan(i);
  }
  await expect(page.getByRole('button', { name: 'Continue with Google', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue with Discord', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in with a passkey', exact: true })).toBeVisible();
  await expect(page).toHaveTitle('Meldiq');
  const nativeTitle = await client.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].getTitle());
  if (!nativeTitle.includes('isolated local QA')) throw new Error('Isolated test window was not labeled');
  await page.screenshot({ path: 'test-results/auth-options-recovered.png' });
  const result = { recordedAt: new Date().toISOString(), platform: process.platform, scope: 'actual Electron with isolated metadata endpoints; no provider sign-in or account mutation', passed: ['provider/metadata failures visible with retry', 'email sign-in remains available during metadata failure', 'Google and Discord options restored after retry', 'passkey option follows WebAuthn capability and approved RP origin', 'isolated test title identifies local QA'], counts: { passed: 5, failed: 0 } };
  await fs.writeFile('test-results/auth-options-smoke.json', JSON.stringify(result, null, 2)); console.log(JSON.stringify(result, null, 2));
} finally {
  if (client) { await client.evaluate(({ app }) => app.exit(0)).catch(() => undefined); await client.close().catch(() => undefined); }
  await new Promise(resolve => server.close(resolve)); await fs.rm(profile, { recursive: true, force: true });
}
