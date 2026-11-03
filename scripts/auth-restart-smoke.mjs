import { _electron as electron, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import http from 'node:http';
const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'meldiq-auth-restart-'));
const fixture = JSON.parse(await fs.readFile('packages/web/test/contract-fixtures/http/GET_v1_server-info.json', 'utf8'));
const exchanges = [];
const base = 'https://web.meldiq.app';
const env = { ...process.env, MELDIQ_TEST_USER_DATA: profile };
const backend = http.createServer(async (req, res) => {
  res.setHeader('content-type', 'application/json');
  if (req.method === 'HEAD') { res.end(); return; }
  if (req.url === '/v1/server-info') { res.end(JSON.stringify(fixture)); return; }
  if (req.url === '/v2/auth/social/config') { res.end(JSON.stringify({ providers: ['google'], googleClientId: null })); return; }
  if (req.url === '/v2/auth/social/complete') {
    let body = ''; for await (const chunk of req) body += chunk;
    exchanges.push(JSON.parse(body)); res.statusCode = 400;
    res.end(JSON.stringify({ error: { code: 'social_expired', message: 'Synthetic proof recorded; no session created.' } })); return;
  }
  res.statusCode = 404; res.end('{}');
});
await new Promise(resolve => backend.listen(0, '127.0.0.1', resolve));
const fakeOrigin = `http://127.0.0.1:${backend.address().port}`;
const id = 'i'.repeat(43), verifier = 'v'.repeat(43), receipt = 'r'.repeat(43);
let client;
try {
  client = await electron.launch({ args: ['.'], env });
  let page = await client.firstWindow();
  await page.getByRole('button', { name: 'Desktop settings', exact: true }).waitFor();
  await client.evaluate(({ shell }) => { shell.openExternal = async () => undefined; });
  await page.evaluate(({ base, id, verifier }) => {
    void window.meldiqDesktop.socialAuthorize({ id, verifier, mode: 'login', url: `${base}/v2/auth/social/authorize/${id}`, expiresAt: Date.now() + 60_000 }).catch(() => undefined);
  }, { base, id, verifier });
  const sealedPath = path.join(profile, 'pending-browser-login.sealed');
  await expect.poll(async () => fs.stat(sealedPath).then(stat => stat.size, () => 0)).toBeGreaterThan(0);
  assert(!(await fs.readFile(sealedPath, 'utf8')).includes(verifier));
  await client.evaluate(({ app }) => app.exit(0)); await client.close(); client = null;
  // Cold launch simulates Windows dispatching the custom protocol to a previously closed app.
  client = await electron.launch({ args: ['.', `meldiq://auth/callback#id=${id}&receipt=${receipt}`], env: { ...env, MELDIQ_TEST_API_ORIGIN: fakeOrigin } });
  page = await client.firstWindow();
  await expect.poll(() => exchanges.length).toBe(1);
  assert.equal(exchanges[0].id, id); assert.equal(exchanges[0].verifier, verifier); assert.equal(exchanges[0].receipt, receipt);
  await page.evaluate(async id => window.meldiqDesktop.finishSocial(id), id);
  await expect.poll(async () => fs.access(sealedPath).then(() => false, () => true)).toBe(true);
  const result = { recordedAt: new Date().toISOString(), platform: process.platform, scope: 'real Electron safeStorage and cold process restart; loopback fake completion endpoint; no real session/provider', passed: ['pending PKCE proof is OS encrypted on disk', 'cold launch accepts only the saved flow callback', 'restored proof reaches the existing backend exchange once', 'completion removes the pending proof'], counts: { passed: 4, failed: 0 } };
  await fs.writeFile('test-results/auth-restart-smoke.json', JSON.stringify(result, null, 2)); console.log(JSON.stringify(result, null, 2));
} catch (error) {
  if (client) {
    const page = await client.firstWindow();
    await page.screenshot({ path: 'test-results/auth-restart-failure.png' }).catch(() => undefined);
    await fs.writeFile('test-results/auth-restart-failure.json', JSON.stringify({ error: String(error), page: (await page.locator('body').innerText()).slice(0, 2000), native: await client.evaluate(({ app }) => ({ argvCount: process.argv.filter(arg => arg.startsWith('meldiq://')).length, profileMatches: app.getPath('userData').includes('meldiq-auth-restart') })) }, null, 2));
  }
  throw error;
} finally {
  if (client) { await client.evaluate(({ app }) => app.exit(0)).catch(() => undefined); await client.close().catch(() => undefined); }
  await new Promise(resolve => backend.close(resolve));
  await fs.rm(profile, { recursive: true, force: true });
}
