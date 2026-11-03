import { afterEach, expect, it, vi } from 'vitest';
import type { Preferences } from '../shared/contracts';
const sdk = vi.hoisted(() => ({ handlers: new Map<string, (info: unknown) => void>(), checkForUpdates: vi.fn(), downloadUpdate: vi.fn(), quitAndInstall: vi.fn(), setFeedURL: vi.fn() }));
vi.mock('electron-updater', () => ({ Provider: class {}, NsisUpdater: class {}, autoUpdater: { on: (event: string, handler: (info: unknown) => void) => sdk.handlers.set(event, handler), checkForUpdates: sdk.checkForUpdates, downloadUpdate: sdk.downloadUpdate, quitAndInstall: sdk.quitAndInstall, setFeedURL: sdk.setFeedURL } }));
vi.mock('../main/signature', () => ({ verifyWindowsSignature: vi.fn() }));
import { verifyWindowsSignature } from '../main/signature';
import { Updates } from '../main/updater';
const active: Updates[] = [];
afterEach(() => { for (const u of active.splice(0)) u.dispose(); vi.clearAllMocks(); sdk.handlers.clear(); });
function setup() {
  const prefs: Preferences = { performance: 'auto', cacheMB: 128, hardwareAcceleration: true, closeToTray: true, startAtLogin: false, notifications: true, updateMode: 'manual', channel: 'beta' };
  const platform = Object.getOwnPropertyDescriptor(process, 'platform')!;
  let updates: Updates;
  try {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    updates = new Updates({ version: '0.1.0', commit: 'fixture', timestamp: 'fixture', channel: 'beta', distribution: 'direct' }, 'https://updates.meldiq.app', true, 'Expected Publisher', () => prefs, () => false, () => undefined);
  } finally { Object.defineProperty(process, 'platform', platform); }
  active.push(updates!);
  return { updates: updates!, prefs };
}
it('distinguishes network failures from actual manifest and file authentication failures', () => {
  const { updates } = setup();
  sdk.handlers.get('error')!(new Error('Network request failed for a sha512 download'));
  expect(updates.failureKind).toBe('network-or-other');
  sdk.handlers.get('error')!(Object.assign(new Error('Untrusted signature'), { code: 'MELDIQ_METADATA_AUTHENTICATION' }));
  expect(updates.failureKind).toBe('manifest-authentication');
  sdk.handlers.get('error')!(Object.assign(new Error('File mismatch'), { code: 'ERR_CHECKSUM_MISMATCH' }));
  expect(updates.failureKind).toBe('artifact-authentication');
});
it('rejects a channel switch while an installer signature is still being verified', async () => {
  let finish!: (problem: string | null) => void;
  vi.mocked(verifyWindowsSignature).mockReturnValue(new Promise(resolve => { finish = resolve; }));
  const { updates, prefs } = setup();
  sdk.handlers.get('download-progress')!({ percent: 100 });
  sdk.handlers.get('update-downloaded')!({ downloadedFile: 'beta.exe', version: '0.2.0-beta.1' });
  // A caller must validate before persisting the new preference.
  expect(() => updates.configure()).toThrow(/progress|verif|finish/i);
  finish(null);
  await new Promise(resolve => setImmediate(resolve));
  expect(updates.state.status).toBe('downloaded');
  prefs.channel = 'stable';
  updates.configure();
  expect(updates.state.status).toBe('idle');
  await expect(updates.action('install')).rejects.toThrow('No verified update');
});
it('blocks feed changes through an outstanding update check', async () => {
  let finish!: () => void;
  sdk.checkForUpdates.mockReturnValue(new Promise<void>(resolve => { finish = resolve; }));
  const { updates } = setup();
  const checking = updates.action('check');
  expect(() => updates.assertCanConfigure()).toThrow(/Finish/);
  finish();
  await checking;
  expect(() => updates.assertCanConfigure()).not.toThrow();
});
it('blocks feed changes during a download and rejects a failed signature', async () => {
  let finish!: () => void;
  sdk.downloadUpdate.mockReturnValue(new Promise<void>(resolve => { finish = resolve; }));
  vi.mocked(verifyWindowsSignature).mockResolvedValue('Wrong publisher');
  const { updates } = setup();
  sdk.handlers.get('update-available')!({ version: '0.2.0-beta.1' });
  const downloading = updates.action('download');
  expect(() => updates.assertCanConfigure()).toThrow(/Finish/);
  sdk.handlers.get('update-downloaded')!({ downloadedFile: 'beta.exe', version: '0.2.0-beta.1' });
  finish();
  await downloading;
  await new Promise(resolve => setImmediate(resolve));
  expect(updates.state.status).toBe('error');
  await expect(updates.action('install')).rejects.toThrow('No verified update');
});
it('prevents changing channels while the install-time signature recheck is pending', async () => {
  vi.mocked(verifyWindowsSignature).mockResolvedValue(null);
  const { updates } = setup();
  sdk.handlers.get('update-downloaded')!({ downloadedFile: 'beta.exe', version: '0.2.0-beta.1' });
  await new Promise(resolve => setImmediate(resolve));
  let finish!: (problem: string | null) => void;
  vi.mocked(verifyWindowsSignature).mockReturnValue(new Promise(resolve => { finish = resolve; }));
  const installing = updates.action('install');
  expect(() => updates.assertCanConfigure()).toThrow(/Finish/);
  finish(null);
  await installing;
  expect(sdk.quitAndInstall).toHaveBeenCalledWith(false, true);
});
