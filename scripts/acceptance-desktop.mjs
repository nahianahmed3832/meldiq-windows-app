import { _electron as electron } from '@playwright/test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { loadAcceptance } from './acceptance-config.mjs';

const args = process.argv.slice(2);
const index = args.indexOf('--env');
const config = loadAcceptance(index < 0 ? undefined : args[index + 1]);
const compiled = JSON.parse(await fs.readFile('dist/runtime-config.json', 'utf8'));
if (compiled.apiOrigin !== config.MELDIQ_ACCEPTANCE_API_ORIGIN || compiled.websocketUrl !== config.MELDIQ_ACCEPTANCE_WS_URL) throw new Error('Acceptance targets must match the existing desktop build. No production override is permitted.');
const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'meldiq-public-acceptance-'));
let app;
const report = { checkedAt: new Date().toISOString(), scope: 'Signed-out desktop public API and unauthenticated WebSocket handshake only', platform: process.platform, authVerified: false, productionAccepted: false };
try {
  // Do not inherit QA credentials or unrelated service credentials into Electron.
  const env = Object.fromEntries(['PATH', 'HOME', 'TMPDIR', 'TEMP', 'TMP', 'SystemRoot', 'WINDIR', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'DISPLAY', 'XAUTHORITY'].filter(k => process.env[k]).map(k => [k, process.env[k]]));
  app = await electron.launch({ args: ['.'], env: { ...env, MELDIQ_TEST_USER_DATA: profile }, timeout: 60_000 });
  const page = await app.firstWindow();
  await page.getByRole('button', { name: 'Continue with email', exact: true }).waitFor();
  report.build = await page.evaluate(async () => (await window.meldiqDesktop.state()).build);
  report.probes = await page.evaluate(async () => {
    const result = [];
    for (const route of ['/v1/server-info', '/v2/auth/social/config', '/v2/billing/plans', '/v2/billing/promotions/preference']) {
      try {
        const r = await fetch(route, { credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(15000) });
        const json = await r.json().catch(() => null);
        const item = { route, status: r.status };
        if (r.ok && json && route.endsWith('server-info')) item.info = { version: json.version, api: json.api, calling: json.calling };
        if (r.ok && json && route.endsWith('social/config')) item.info = { providers: json.providers, authorizeOrigin: json.authorizeOrigin };
        if (r.ok && json && route.endsWith('billing/plans')) item.info = { available: json.available, mode: json.mode };
        result.push(item);
      } catch { result.push({ route, status: null, error: 'Desktop connection or policy failure' }); }
    }
    return result;
  });
  report.websocket = await page.evaluate(url => new Promise(resolve => {
    const ws = new WebSocket(url);
    const timer = setTimeout(() => { ws.close(); resolve({ opened: false, error: 'Handshake timeout' }); }, 10000);
    ws.onopen = () => { clearTimeout(timer); ws.close(1000); resolve({ opened: true, authenticated: false }); };
    ws.onerror = () => { clearTimeout(timer); ws.close(); resolve({ opened: false, error: 'Handshake rejected or blocked' }); };
  }), config.MELDIQ_ACCEPTANCE_WS_URL);
} finally {
  await app?.close();
  await fs.rm(profile, { recursive: true, force: true });
}
await fs.mkdir('test-results', { recursive: true });
await fs.writeFile('test-results/acceptance-desktop.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
if (report.probes.some(p => p.status !== (p.route === '/v2/billing/promotions/preference' ? 401 : 200)) || !report.websocket.opened) process.exitCode = 2;
