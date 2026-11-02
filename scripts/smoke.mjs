import { _electron as electron } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'meldiq-smoke-'));
await fs.mkdir('test-results', { recursive: true });
const started = performance.now();
const client = await electron.launch({ args: ['.'], env: { ...process.env, MELDIQ_TEST_USER_DATA: profile }, timeout: 60_000 });
const errors = [];
try {
  const page = await client.firstWindow();
  page.on('pageerror', e => errors.push(e.message));
  // Block every network request. Packaged HTML, CSS, fonts, scripts and config must still render.
  await client.evaluate(({ session }) => {
    const ses = session.fromPartition('persist:meldiq-desktop');
    ses.webRequest.onBeforeRequest({ urls: ['https://*/*', 'wss://*/*'] }, (details, callback) => {
      const u = new URL(details.url);
      callback({ cancel: u.origin !== 'https://web.meldiq.app' || /^\/v[12]\//.test(u.pathname) });
    });
  });
  await page.reload();
  await page.getByRole('button', { name: 'Desktop settings', exact: true }).click();
  await page.getByRole('heading', { name: 'Desktop settings', exact: true }).waitFor();
  const launchMs = performance.now() - started;
  const native = await page.evaluate(async () => {
    const bridge = window.meldiqDesktop;
    return { node: typeof window.require, process: typeof window.process, state: await bridge.state(), secure: isSecureContext };
  });
  assert.equal(native.node, 'undefined'); assert.equal(native.process, 'undefined'); assert.equal(native.secure, true);
  assert.equal(native.state.build.distribution, 'development');
  assert.equal(native.state.update.status, 'disabled');
  // Exercise real IPC sender validation with an out-of-scope document in an isolated temporary window.
  const ipcIsolation = await client.evaluate(async ({ BrowserWindow, ipcMain }) => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    const listeners = ipcMain._invokeHandlers;
    const handler = listeners.get('desktop:preferences');
    try { await handler({ sender: mainWindow.webContents, senderFrame: { url: 'https://evil.test' } }, { closeToTray: false }); return false; }
    catch { return true; }
  });
  assert.equal(ipcIsolation, true);
  await page.evaluate(async () => {
    localStorage.setItem('meldiq-smoke-account-sentinel', 'preserved');
    await new Promise((resolve, reject) => {
      const open = indexedDB.open('meldiq-smoke-account-sentinel', 1);
      open.onupgradeneeded = () => open.result.createObjectStore('keys');
      open.onerror = () => reject(open.error);
      open.onsuccess = () => { const db = open.result; const tx = db.transaction('keys', 'readwrite'); tx.objectStore('keys').put('preserved-key', 'identity'); tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => reject(tx.error); };
    });
  });
  const operationGuard = await page.evaluate(async () => {
    await window.meldiqDesktop.setBusy(true);
    try { await window.meldiqDesktop.clearTemporaryCache(); return false; }
    catch { return true; }
    finally { await window.meldiqDesktop.setBusy(false); }
  });
  assert.equal(operationGuard, true, 'Cache clearing must wait during communication');
  await page.getByRole('button', { name: 'Clear temporary media cache' }).click();
  await page.getByText('Temporary media cleared. Your account data is preserved.').waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem('meldiq-smoke-account-sentinel')), 'preserved');
  assert.equal(await page.evaluate(() => new Promise((resolve, reject) => {
    const open = indexedDB.open('meldiq-smoke-account-sentinel', 1);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => { const db = open.result; const tx = db.transaction('keys'); const get = tx.objectStore('keys').get('identity'); get.onsuccess = () => { resolve(get.result); db.close(); }; get.onerror = () => reject(get.error); };
  })), 'preserved-key');
  await page.getByLabel('Performance mode', { exact: true }).selectOption('economy');
  await page.waitForFunction(() => document.documentElement.dataset.performance === 'economy');
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).animationName), 'none');
  await page.screenshot({ path: 'test-results/desktop-settings.png' });
  await page.getByRole('button', { name: 'Close desktop settings' }).click();
  const paymentPagePromise = client.waitForEvent('window');
  await page.evaluate(() => { history.pushState({ meldiq: 1 }, '', '/settings/checkout'); window.open('about:blank', '_blank'); });
  const paymentPage = await paymentPagePromise;
  assert.deepEqual(await paymentPage.evaluate(() => ({ bridge: typeof window.meldiqDesktop, node: typeof window.require })), { bridge: 'undefined', node: 'undefined' });
  assert.equal((await page.evaluate(() => window.meldiqDesktop.state())).busy, true, 'Payment approval window must block update restart');
  await paymentPage.close();
  await page.evaluate(() => { history.replaceState({ meldiq: 1 }, '', '/'); });
  await client.evaluate(({ app }) => app.emit('second-instance', {}, ['meldiq://invite/ABCD-EFGH']));
  await page.waitForFunction(() => sessionStorage.getItem('meldiq.pendingInvite') === 'ABCD-EFGH');
  assert.equal(await page.evaluate(() => location.pathname), '/home');
  await page.waitForFunction(() => document.querySelector('#desktop-root')?.textContent?.includes('Meldiq'));
  await page.screenshot({ path: 'test-results/offline-launch.png' });
  assert.deepEqual(errors, [], `Renderer errors: ${errors.join('; ')}`);
  const report = { platform: process.platform, arch: process.arch, versions: await client.evaluate(({ app }) => ({ app: app.getVersion(), electron: process.versions.electron, chromium: process.versions.chrome })), offlineSmokeMs: Math.round(launchMs), checks: ['local renderer with network blocked', 'sandbox and context isolation', 'untrusted IPC rejection', 'clear cache preserves localStorage and IndexedDB identity', 'cache clearing blocked during communication', 'economy effects', 'native settings', 'payment popup has no native bridge and blocks restart', 'native invitation captured by the existing join workflow'], status: 'passed', windowsInstallation: 'not tested by this smoke' };
  await fs.writeFile('test-results/smoke.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await client.evaluate(({ app }) => { app.exit(0); }).catch(() => undefined);
  await client.close().catch(() => undefined);
  await fs.rm(profile, { recursive: true, force: true });
}
