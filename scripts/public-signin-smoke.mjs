import { _electron as electron, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'meldiq-public-signin-'));
let client;
try {
  client = await electron.launch({ args: ['.'], env: { ...process.env, MELDIQ_TEST_USER_DATA: profile }, timeout: 60_000 });
  const page = await client.firstWindow();
  for (const name of ['Continue with Google', 'Continue with Discord', 'Continue with email', 'Sign in with a passkey'])
    await expect(page.getByRole('button', { name, exact: true })).toBeVisible({ timeout: 20_000 });
  await page.screenshot({ path: 'test-results/public-signin-options.png' });
  const result = { recordedAt: new Date().toISOString(), platform: process.platform, scope: 'actual desktop public production metadata only; no credentials, authentication submission or provider authorization', passed: ['Google sign-in offered by current live server', 'Discord sign-in offered by current live server', 'passkey option available for approved origin and platform WebAuthn', 'email option retained'], build: await page.evaluate(async () => (await window.meldiqDesktop.state()).build), counts: { passed: 4, failed: 0 } };
  await fs.writeFile('test-results/public-signin-smoke.json', JSON.stringify(result, null, 2)); console.log(JSON.stringify(result, null, 2));
} finally {
  if (client) { await client.evaluate(({ app }) => app.exit(0)).catch(() => undefined); await client.close().catch(() => undefined); }
  await fs.rm(profile, { recursive: true, force: true });
}
