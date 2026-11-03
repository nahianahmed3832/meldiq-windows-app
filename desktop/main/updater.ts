import { autoUpdater, NsisUpdater } from 'electron-updater';
import { verifyWindowsSignature } from './signature';
import { SignedReleaseTrust, type ReleaseTrustConfig } from './signed-release';
import { SignedReleaseProvider } from './signed-provider';
import path from 'node:path';
import type { BuildInfo, Preferences, UpdateState } from '../shared/contracts';
export class Updates {
  state: UpdateState = { status: 'disabled', message: 'Development build: automatic updates are disabled.' };
  private checking = false;
  private timer?: ReturnType<typeof setInterval>;
  private enabled: boolean;
  private verifiedFile: string | null = null;
  private installing = false;
  private downloading = false;
  private verifying = false;
  private signedTrust: SignedReleaseTrust | null = null;
  failureKind: 'manifest-authentication' | 'artifact-authentication' | 'network-or-other' | null = null;
  private classifyFailure(error: unknown) {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : null;
    return code === 'MELDIQ_METADATA_AUTHENTICATION' ? 'manifest-authentication' as const : code === 'ERR_CHECKSUM_MISMATCH' ? 'artifact-authentication' as const : 'network-or-other' as const;
  }
  constructor(private readonly build: BuildInfo, private readonly origin: string, approved: boolean,
    private readonly publisher: string | null, private readonly prefs: () => Preferences, private readonly busy: () => boolean, private readonly changed: () => void, private readonly releaseTrust?: ReleaseTrustConfig) {
    this.enabled = ['direct', 'private-direct'].includes(build.distribution) && approved && process.platform === 'win32';
    if (!this.enabled) return;
    this.state = { status: 'idle' };
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.allowDowngrade = false;
    autoUpdater.disableWebInstaller = true;
    autoUpdater.disableDifferentialDownload = true;
    if (build.distribution === 'private-direct' && !releaseTrust) throw new Error('Private updates require pinned release keys');
    if (build.distribution === 'private-direct' && autoUpdater instanceof NsisUpdater) autoUpdater.installDirectory = path.dirname(process.execPath);
    if (build.distribution === 'direct' && autoUpdater instanceof NsisUpdater) autoUpdater.verifyUpdateCodeSignature = verifyWindowsSignature;
    autoUpdater.on('checking-for-update', () => this.set({ status: 'checking' }));
    autoUpdater.on('update-available', info => {
      this.set({ status: 'available', version: info.version });
      if (this.prefs().updateMode !== 'manual') void this.download();
    });
    autoUpdater.on('update-not-available', () => this.set({ status: 'idle', message: 'You have the latest version for this channel.' }));
    autoUpdater.on('download-progress', info => this.set({ status: 'downloading', percent: info.percent }));
    autoUpdater.on('update-downloaded', info => {
      this.verifying = true;
      void this.verifyCandidate(info.downloadedFile).then(problem => {
        if (problem) { this.failureKind = 'artifact-authentication'; this.verifiedFile = null; this.set({ status: 'error', message: problem }); return; }
        this.verifiedFile = info.downloadedFile;
        this.set({ status: 'downloaded', version: info.version, message: 'Ready to install when your calls and transfers finish.' });
      }).catch(() => { this.verifiedFile = null; this.set({ status: 'error', message: 'The update signature could not be verified.' }); }).finally(() => { this.verifying = false; });
    });
    autoUpdater.on('error', error => { this.failureKind = this.classifyFailure(error); this.set({ status: 'error', message: 'Update failed. Check your connection and try again.' }); });
    this.configure();
    this.timer = setInterval(() => { if (this.prefs().updateMode !== 'manual') void this.check(); }, 6 * 60 * 60_000);
    this.timer.unref();
    if (this.prefs().updateMode !== 'manual') setTimeout(() => void this.check(), 15_000).unref();
  }
  configure() {
    if (!this.enabled) return;
    this.assertCanConfigure();
    const channel = this.prefs().channel;
    autoUpdater.allowPrerelease = channel !== 'stable';
    autoUpdater.channel = channel === 'stable' ? 'latest' : channel;
    if (this.build.distribution === 'private-direct') {
      this.signedTrust = new SignedReleaseTrust(this.releaseTrust!, this.origin, channel);
      const provider = { provider: 'custom' as const, updateProvider: SignedReleaseProvider, trust: this.signedTrust };
      autoUpdater.setFeedURL(provider);
    } else autoUpdater.setFeedURL({ provider: 'generic', url: `${this.origin}/windows/${channel}/`, channel: channel === 'stable' ? 'latest' : channel });
    // Switching a channel invalidates a previously offered installer.
    this.verifiedFile = null;
    this.set({ status: 'idle' });
  }
  assertCanConfigure() {
    if (this.enabled && (this.checking || this.downloading || this.verifying || this.installing || this.state.status === 'downloading')) throw new Error('Finish the update check, download or verification before changing channels.');
  }
  private verifyCandidate(filename: string) {
    return this.signedTrust ? this.signedTrust.verifyFile(filename) : verifyWindowsSignature(this.publisher ? [this.publisher] : [], filename);
  }
  async action(action: unknown) {
    if (!['check', 'download', 'install'].includes(String(action))) throw new Error('Invalid update action');
    if (!this.enabled) throw new Error(this.state.message ?? 'Updates unavailable for this installation');
    if (action === 'check') return this.check();
    if (action === 'download') return this.download();
    if (this.busy()) throw new Error('Finish your call, screen sharing and file transfers before restarting.');
    if (this.state.status !== 'downloaded' || !this.verifiedFile || this.installing) throw new Error('No verified update is ready');
    this.installing = true;
    const problem = await this.verifyCandidate(this.verifiedFile);
    if (problem || this.busy()) { this.installing = false; throw new Error(problem ?? 'A call or transfer started. Finish it before restarting.'); }
    autoUpdater.quitAndInstall(this.build.distribution === 'private-direct', true);
  }
  installOnSafeExit(): boolean {
    if (!this.enabled || this.state.status !== 'downloaded' || this.prefs().updateMode !== 'automatic' || this.busy()) return false;
    void this.action('install').catch(() => { this.installing = false; this.set({ status: 'error', message: 'The update could not be safely installed. Try again from Desktop settings.' }); });
    return true;
  }
  dispose() { clearInterval(this.timer); }
  private async check() {
    if (this.checking || this.state.status === 'downloading' || this.state.status === 'downloaded') return;
    this.checking = true;
    this.failureKind = null;
    try { await autoUpdater.checkForUpdates(); }
    catch (error) { this.failureKind = this.classifyFailure(error); this.set({ status: 'error', message: 'Update check failed. Try again later.' }); }
    finally { this.checking = false; }
  }
  private async download() {
    if (!['available', 'error'].includes(this.state.status)) return;
    this.downloading = true;
    this.failureKind = null;
    this.set({ status: 'downloading', percent: 0 });
    try { await autoUpdater.downloadUpdate(); }
    catch (error) { this.failureKind = this.classifyFailure(error); this.set({ status: 'error', message: 'Download failed. Check for updates to retry.' }); }
    finally { this.downloading = false; }
  }
  private set(state: UpdateState) { this.state = state; this.changed(); }
}
