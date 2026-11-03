import { Provider } from 'electron-updater';
import type { ProviderRuntimeOptions } from 'electron-updater/out/providers/Provider';
import type { ResolvedUpdateFileInfo } from 'electron-updater';
import type { UpdateInfo } from 'builder-util-runtime';
import { SignedReleaseTrust } from './signed-release';

export class SignedReleaseProvider extends Provider<UpdateInfo> {
  private readonly trust: SignedReleaseTrust;
  constructor(options: unknown, _updater: unknown, runtime: ProviderRuntimeOptions) {
    super({ ...runtime, isUseMultipleRangeRequest: false });
    if (!options || typeof options !== 'object' || !('trust' in options) || !(options.trust instanceof SignedReleaseTrust)) throw new Error('Signed update provider requires pinned release keys');
    this.trust = options.trust;
  }
  async getLatestVersion(): Promise<UpdateInfo> {
    const r = await this.trust.fetchRelease();
    return { version: r.version, files: [{ url: r.file.url, sha512: r.file.sha512, size: r.file.size }], path: r.file.url, sha512: r.file.sha512, releaseDate: r.releasedAt };
  }
  resolveFiles(info: UpdateInfo): ResolvedUpdateFileInfo[] {
    const r = this.trust.release;
    if (info.version !== r.version) throw new Error('Update version changed after authentication');
    return [{ url: new URL(r.file.url), info: { url: r.file.url, sha512: r.file.sha512, size: r.file.size } }];
  }
}
