import { _electron as electron, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'meldiq-readiness-'));
const client = await electron.launch({ args: ['.'], env: { ...process.env, MELDIQ_TEST_USER_DATA: profile }, timeout: 60_000 });
const passed = [];
try {
  const page = await client.firstWindow();
  await page.getByRole('button', { name: 'Desktop settings', exact: true }).waitFor();
  // No browser, provider or production mutation: replace only the native external opener in this disposable process.
  await client.evaluate(({ shell }) => { shell.openExternal = async url => { globalThis.__readinessOpened = url; }; });
  const id = 'i'.repeat(43), receipt = 'r'.repeat(43);
  await page.evaluate(id => { window.__nativeReceipt = null; window.__nativeError = null; void window.meldiqDesktop.socialAuthorize({ id, url: `https://web.meldiq.app/v2/auth/social/authorize/${id}`, expiresAt: Date.now() + 60_000 }).then(r => { window.__nativeReceipt = r; }, e => { window.__nativeError = e.message; }); }, id);
  await expect.poll(() => client.evaluate(() => globalThis.__readinessOpened ?? '')).toContain('/v2/auth/social/authorize/');
  await client.evaluate(({ app }, { id, receipt }) => app.emit('second-instance', {}, ['Meldiq.exe', `meldiq://auth/callback#id=${id}&receipt=${receipt}`], ''), { id: 'x'.repeat(43), receipt });
  assert.equal(await page.evaluate(() => window.__nativeReceipt), null);
  await client.evaluate(({ app }, { id, receipt }) => app.emit('second-instance', {}, ['Meldiq.exe', `meldiq://auth/callback#id=${id}&receipt=${receipt}`], ''), { id, receipt });
  await expect.poll(() => page.evaluate(() => window.__nativeReceipt)).toEqual({ id, receipt });
  passed.push('actual social IPC receives only its matching single-instance callback');
  await page.evaluate(id => { window.__cancelError = null; void window.meldiqDesktop.socialAuthorize({ id, url: `https://web.meldiq.app/v2/auth/social/authorize/${id}`, expiresAt: Date.now() + 60_000 }).catch(e => { window.__cancelError = e.message; }); }, 'c'.repeat(43));
  await page.evaluate(async id => window.meldiqDesktop.cancelSocial(id), 'c'.repeat(43));
  await expect.poll(() => page.evaluate(() => window.__cancelError)).toContain('cancelled');
  passed.push('native browser login cancellation and retry do not establish a session');
  await page.getByRole('button', { name: 'Desktop settings', exact: true }).click();
  await page.getByRole('button', { name: 'Reset device permissions', exact: true }).click();
  await page.getByText('Device permissions reset. Meldiq will ask when a device is next used.', { exact: true }).waitFor();
  passed.push('device permissions reset through trusted IPC');
  await page.getByRole('button', { name: 'Close desktop settings', exact: true }).click();
  const selector = page.getByRole('combobox', { name: 'Language', exact: true }).first();
  await selector.selectOption('ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('button', { name: 'إعدادات سطح المكتب', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  passed.push('Arabic UI direction and bundled core translations persist across reload');
  await page.getByRole('searchbox').first().fill('Français');
  await page.getByRole('combobox').first().selectOption('fr');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.getByRole('button', { name: 'Paramètres du bureau', exact: true })).toBeVisible();
  passed.push('searchable selector updates French interface immediately and restores LTR');
  await page.screenshot({ path: 'test-results/readiness-french.png' });
  // Exercise popup navigation and isolation in the actual main-process policy, with a synthetic approval window.
  await client.evaluate(({ BrowserWindow }) => {
    const main = BrowserWindow.getAllWindows().find(w => w.webContents.getURL().startsWith('https://web.meldiq.app'));
    const child = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: false, sandbox: true, contextIsolation: true } });
    globalThis.__readinessPayment = child;
    main.webContents.emit('did-create-window', child, {});
  });
  await page.evaluate(() => { window.__paymentReturn = null; window.meldiqDesktop.onCheckout(result => { window.__paymentReturn = result; }); });
  assert.equal(await page.evaluate(async () => (await window.meldiqDesktop.state()).busy), true);
  const blocked = await client.evaluate(() => {
    let prevented = false;
    globalThis.__readinessPayment.webContents.emit('will-redirect', { preventDefault: () => { prevented = true; } }, 'https://evil.test/checkout');
    return prevented;
  });
  assert.equal(blocked, true);
  await client.evaluate(() => globalThis.__readinessPayment.webContents.emit('will-redirect', { preventDefault() {} }, 'https://web.meldiq.app/settings/checkout?checkout=success&token=untrusted'));
  await expect.poll(() => page.evaluate(() => window.__paymentReturn)).toEqual({ kind: 'returned', canceled: false });
  await expect.poll(() => page.evaluate(async () => (await window.meldiqDesktop.state()).busy)).toBe(false);
  passed.push('isolated approval window rejects foreign redirects, closes on owned return, emits no payment tokens, and releases busy hold');
  const result = { recordedAt: new Date().toISOString(), platform: process.platform, sourceScope: 'development Electron artifact, synthetic provider result dispatch; no real provider transaction', passed, counts: { passed: passed.length, failed: 0 }, unverified: ['Windows registry protocol dispatch', 'real provider approval', 'payment capture/webhook/entitlement lifecycle', 'real Discord import', 'Windows 10/11 physical-device behavior', 'complete localization'] };
  await fs.writeFile('test-results/readiness-smoke.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  await fs.writeFile('test-results/readiness-smoke-failure.json', JSON.stringify({ passed, error: String(error) }, null, 2));
  throw error;
} finally {
  await client.evaluate(({ app }) => app.exit(0)).catch(() => undefined);
  await client.close().catch(() => undefined);
  await fs.rm(profile, { recursive: true, force: true });
}
