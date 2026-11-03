// This module is reachable only from UPDATER_LAB labels, removed from public builds.
import fs from 'node:fs';
import type { App, BrowserWindow } from 'electron';
import type { Updates } from './updater';
interface LabControl { scenario: 'bad-signature' | 'bad-hash' | 'upgrade'; profile: string; report: string; oldVersion: string; newVersion: string }
async function persistentFixture(seed: boolean) {
  const bridge = window.meldiqDesktop!;
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open('meldiq-update-qualification', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('records');
    r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
  });
  const read = (key: string) => new Promise<unknown>((resolve, reject) => {
    const r = db.transaction('records').objectStore('records').get(key); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
  });
  const write = (key: string, value: unknown) => new Promise<void>((resolve, reject) => {
    const t = db.transaction('records', 'readwrite'); t.objectStore('records').put(value, key); t.oncomplete = () => resolve(); t.onerror = () => reject(t.error);
  });
  try {
    if (seed) {
      await write('account', { userId: 'update-fixture-account', label: 'Local upgrade qualification' });
      await write('message', { id: 'update-fixture-message', body: 'Message retained through an installed Windows upgrade' });
      await write('sealedSession', await bridge.sealSession({ accessToken: 'fixture-access-token', refreshToken: 'fixture-refresh-token', sessionId: 'fixture-session', accessTokenExpiresAt: Date.now() + 3600000, refreshTokenExpiresAt: Date.now() + 86400000 }));
      localStorage.setItem('meldiq-update-fixture', 'retained');
    }
    const account = await read('account') as { userId: string }, message = await read('message') as { body: string };
    const tokens = await bridge.openSession(await read('sealedSession') as string);
    return { accountRetained: account.userId === 'update-fixture-account', messageRetained: message.body === 'Message retained through an installed Windows upgrade', sealedSessionRetained: tokens.sessionId === 'fixture-session' && tokens.accessToken === 'fixture-access-token', localStorageRetained: localStorage.getItem('meldiq-update-fixture') === 'retained' };
  } finally { db.close(); }
}
export async function runUpdateLab({ app, main, updates, control }: { app: App; main: BrowserWindow; updates: Updates; control: LabControl }) {
  const save = (report: object) => { fs.writeFileSync(control.report, JSON.stringify({ ...report, scenario: control.scenario, version: app.getVersion(), scope: 'Installed NSIS upgrade with local fixture account/message and OS-sealed session; no production account or backend mutations' }, null, 2)); };
  try {
    if (main.webContents.isLoadingMainFrame()) await new Promise<void>(resolve => main.webContents.once('did-finish-load', () => resolve()));
    await main.webContents.executeJavaScript('window.meldiqDesktop.state()');
    const fixture = await main.webContents.executeJavaScript('(' + persistentFixture.toString() + ')(' + (app.getVersion() === control.oldVersion ? 'true' : 'false') + ')');
    if (Object.values(fixture).some(v => v !== true)) throw new Error('Persistent upgrade fixtures were not retained');
    if (app.getVersion() === control.newVersion) {
      const previous = JSON.parse(fs.readFileSync(control.report, 'utf8'));
      if (!previous.busyGuardPassed || !previous.automaticCheckAndDownload) throw new Error('Missing automatic upgrade evidence');
      save({ status: 'passed', actualInstallerUpgrade: true, automaticCheckAndDownload: true, automaticInstallOnSafeExit: true, busyGuardPassed: true, ...fixture, oldVersion: control.oldVersion, newVersion: control.newVersion });
      app.exit(0); return;
    }
    if (app.getVersion() !== control.oldVersion) throw new Error('Unexpected installed version');
    await main.webContents.executeJavaScript('window.meldiqDesktop.setBusy(true)');
    const status = () => updates.state.status;
    if (control.scenario !== 'upgrade') await updates.action('check');
    if (control.scenario === 'bad-signature') {
      if (status() !== 'error') throw new Error('Untrusted metadata was accepted');
      save({ status: 'passed', rejectedBeforeDownload: true }); app.exit(0); return;
    }
    if (control.scenario !== 'upgrade') {
      if (status() !== 'available') throw new Error('No authenticated qualification update was offered');
      await updates.action('download');
    }
    const deadline = Date.now() + 240000;
    while (!['downloaded', 'error'].includes(status())) {
      if (Date.now() > deadline) throw new Error('Qualification download timeout');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (control.scenario === 'bad-hash') {
      if (status() !== 'error') throw new Error('Corrupt artifact was accepted');
      save({ status: 'passed', corruptArtifactRejected: true }); app.exit(0); return;
    }
    if (status() !== 'downloaded') throw new Error('Authenticated installer download failed');
    let busyGuardPassed = false;
    try { await updates.action('install'); } catch { busyGuardPassed = true; }
    if (!busyGuardPassed) throw new Error('Installer started while communication was busy');
    save({ status: 'installing', automaticCheckAndDownload: true, busyGuardPassed, oldVersion: control.oldVersion, newVersion: control.newVersion });
    await main.webContents.executeJavaScript('window.meldiqDesktop.setBusy(false)');
    app.quit();
  } catch {
    save({ status: 'failed', message: 'Updater qualification failed; no credential-bearing diagnostics retained', updateState: updates.state.status });
    app.exit(1);
  }
}
