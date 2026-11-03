import { createHash, createPublicKey, verify } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Channel } from '../shared/contracts';

export interface ReleaseKey { keyId: string; publicKey: string }
export interface ReleaseTrustConfig { keys: ReleaseKey[]; appId: string; checkpointFile: string }
export interface SignedRelease {
  schema: 1; appId: string; platform: 'win32'; arch: 'x64'; channel: Channel;
  version: string; sequence: number; releasedAt: string; expiresAt: string;
  file: { url: string; filename: string; size: number; sha256: string; sha512: string };
}
export interface Checkpoint { sequence: number; digest: string }
const domain = Buffer.from('MELDIQ-DESKTOP-UPDATE-V1\n');
function record(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
function exact(value: Record<string, unknown>, keys: string[]) {
  if (Object.keys(value).length !== keys.length || keys.some(k => !Object.hasOwn(value, k))) throw new Error('Invalid signed release structure');
}
function base64(value: unknown, bytes?: number): Buffer {
  if (typeof value !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) throw new Error('Invalid signed release encoding');
  const decoded = Buffer.from(value, 'base64');
  if (decoded.toString('base64') !== value || (bytes !== undefined && decoded.length !== bytes)) throw new Error('Invalid signed release encoding');
  return decoded;
}
export function keyFingerprint(publicKey: string): string {
  const key = createPublicKey(publicKey);
  if (key.asymmetricKeyType !== 'ed25519') throw new Error('Release key must use Ed25519');
  return createHash('sha256').update(key.export({ type: 'spki', format: 'der' })).digest('hex');
}
export function verifyReleaseEnvelope(raw: string, options: { keys: ReleaseKey[]; channel: Channel; appId: string; baseUrl: string; now?: number; checkpoint?: Checkpoint }): { release: SignedRelease; digest: string } {
  if (Buffer.byteLength(raw) > 131072) throw new Error('Release envelope exceeds the size limit');
  const envelope: unknown = JSON.parse(raw);
  if (!record(envelope)) throw new Error('Invalid signed release');
  exact(envelope, ['payload', 'signatures']);
  const payload = base64(envelope.payload);
  if (payload.length > 65536 || !Array.isArray(envelope.signatures) || !envelope.signatures.length || envelope.signatures.length > 4) throw new Error('Invalid signed release');
  let authenticated = false;
  for (const signature of envelope.signatures) {
    if (!record(signature)) throw new Error('Invalid signed release signature');
    exact(signature, ['keyId', 'signature']);
    const trusted = options.keys.find(k => k.keyId === signature.keyId);
    if (!trusted) continue;
    if (keyFingerprint(trusted.publicKey) !== trusted.keyId) throw new Error('Configured release key fingerprint does not match');
    if (verify(null, Buffer.concat([domain, payload]), trusted.publicKey, base64(signature.signature, 64))) authenticated = true;
  }
  if (!authenticated) throw new Error('Release signature is missing or untrusted');
  const r: unknown = JSON.parse(payload.toString('utf8'));
  if (!record(r)) throw new Error('Invalid signed release payload');
  exact(r, ['schema', 'appId', 'platform', 'arch', 'channel', 'version', 'sequence', 'releasedAt', 'expiresAt', 'file']);
  if (r.schema !== 1 || r.appId !== options.appId || r.platform !== 'win32' || r.arch !== 'x64' || r.channel !== options.channel) throw new Error('Release is for another application, platform or channel');
  if (typeof r.version !== 'string' || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:beta|canary)\.(0|[1-9]\d*))?$/.test(r.version) || (r.channel === 'stable' && r.version.includes('-'))) throw new Error('Invalid release version');
  if (!Number.isSafeInteger(r.sequence) || Number(r.sequence) < 1 || typeof r.releasedAt !== 'string' || typeof r.expiresAt !== 'string') throw new Error('Invalid release freshness fields');
  const now = options.now ?? Date.now(), issued = Date.parse(r.releasedAt), expires = Date.parse(r.expiresAt);
  if (!Number.isFinite(issued) || !Number.isFinite(expires) || issued > now + 300000 || expires <= now || expires <= issued || expires - issued > 180 * 86400000) throw new Error('Release is expired or has invalid timestamps');
  if (!record(r.file)) throw new Error('Invalid release artifact');
  exact(r.file, ['url', 'filename', 'size', 'sha256', 'sha512']);
  const f = r.file;
  if (typeof f.filename !== 'string' || !/^Meldiq-[A-Za-z0-9._-]{1,120}\.exe$/.test(f.filename) || !Number.isSafeInteger(f.size) || Number(f.size) < 1 || Number(f.size) > 2147483648 || typeof f.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(f.sha256)) throw new Error('Invalid release artifact fields');
  base64(f.sha512, 64);
  if (typeof f.url !== 'string') throw new Error('Invalid release artifact URL');
  const url = new URL(f.url), base = new URL(options.baseUrl);
  if (base.protocol !== 'https:' || url.protocol !== 'https:' || url.origin !== base.origin || url.username || url.password || url.search || url.hash || !url.pathname.startsWith('/downloads/windows/') || decodeURIComponent(url.pathname.split('/').pop() ?? '') !== f.filename || !url.pathname.includes('/' + r.version + '/')) throw new Error('Release artifact URL is outside the approved HTTPS download origin');
  const digest = createHash('sha256').update(payload).digest('hex');
  if (options.checkpoint && (Number(r.sequence) < options.checkpoint.sequence || (r.sequence === options.checkpoint.sequence && digest !== options.checkpoint.digest))) throw new Error('Replayed or conflicting release metadata');
  return { release: r as unknown as SignedRelease, digest };
}

export class SignedReleaseTrust {
  private raw: string | null = null;
  private current: SignedRelease | null = null;
  constructor(readonly config: ReleaseTrustConfig, readonly baseUrl: string, readonly channel: Channel) {
    if (!config.keys.length || config.keys.length > 4 || config.keys.some(k => keyFingerprint(k.publicKey) !== k.keyId)) throw new Error('Missing or invalid pinned release keys');
    const base = new URL(baseUrl);
    if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) throw new Error('Update feed requires an approved HTTPS URL');
  }
  private checkpoint(): Checkpoint | undefined {
    if (!fs.existsSync(this.config.checkpointFile)) return undefined;
    const all = JSON.parse(fs.readFileSync(this.config.checkpointFile, 'utf8'));
    const value = all[this.channel];
    if (value === undefined) return undefined;
    if (!Number.isSafeInteger(value.sequence) || typeof value.digest !== 'string' || !/^[a-f0-9]{64}$/.test(value.digest)) throw new Error('Invalid release replay-protection state');
    return value;
  }
  accept(raw: string): SignedRelease {
    let verified;
    try { verified = verifyReleaseEnvelope(raw, { ...this.config, baseUrl: this.baseUrl, channel: this.channel, checkpoint: this.checkpoint() }); }
    catch (error) { if (error instanceof Error) Object.assign(error, { code: 'MELDIQ_METADATA_AUTHENTICATION' }); throw error; }
    const file = this.config.checkpointFile;
    const all = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
    all[this.channel] = { sequence: verified.release.sequence, digest: verified.digest };
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file + '.tmp', JSON.stringify(all), { mode: 0o600 });
    fs.renameSync(file + '.tmp', file);
    this.raw = raw; this.current = verified.release;
    return verified.release;
  }
  async fetchRelease(): Promise<SignedRelease> {
    const url = this.baseUrl.replace(/\/?$/, '/') + 'windows/' + this.channel + '/release.json';
    const response = await fetch(url, { redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(20000), headers: { accept: 'application/json' } });
    if (!response.ok || !response.body || Number(response.headers.get('content-length') ?? 0) > 131072) throw new Error('Authenticated update feed is unavailable');
    const reader = response.body.getReader(), chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const part = await reader.read(); if (part.done) break;
        size += part.value.length;
        if (size > 131072) throw new Error('Release envelope exceeds the size limit');
        chunks.push(part.value);
      }
    } finally { await reader.cancel(); }
    return this.accept(Buffer.concat(chunks).toString('utf8'));
  }
  get release(): SignedRelease {
    if (!this.current || !this.raw) throw new Error('No authenticated update has been checked');
    verifyReleaseEnvelope(this.raw, { ...this.config, baseUrl: this.baseUrl, channel: this.channel, checkpoint: this.checkpoint() });
    return this.current;
  }
  async verifyFile(filename: string): Promise<string | null> {
    try {
      const release = this.release;
      const before = await fs.promises.stat(filename);
      if (!before.isFile() || before.size !== release.file.size) return 'Update size does not match the signed release';
      const sha256 = createHash('sha256'), sha512 = createHash('sha512');
      for await (const chunk of fs.createReadStream(filename)) { sha256.update(chunk); sha512.update(chunk); }
      const after = await fs.promises.stat(filename);
      if (before.size !== after.size || before.mtimeMs !== after.mtimeMs || sha256.digest('hex') !== release.file.sha256 || sha512.digest('base64') !== release.file.sha512) return 'Update bytes do not match the signed release';
      return null;
    } catch { return 'The update could not be authenticated with a pinned release key'; }
  }
}
