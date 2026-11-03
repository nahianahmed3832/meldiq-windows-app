import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { keyFingerprint, SignedReleaseTrust, verifyReleaseEnvelope, type SignedRelease } from '../main/signed-release';
const pair = generateKeyPairSync('ed25519');
const publicKey = String(pair.publicKey.export({ type: 'spki', format: 'pem' }));
const keys = [{ keyId: keyFingerprint(publicKey), publicKey }];
const bytes = Buffer.from('Meldiq signed update fixture');
const now = Date.now();
function release(): SignedRelease {
  return { schema: 1, appId: 'app.meldiq.desktop', platform: 'win32', arch: 'x64', channel: 'stable', version: '0.2.0', sequence: 1, releasedAt: new Date(now - 1000).toISOString(), expiresAt: new Date(now + 86400000).toISOString(),
    file: { url: 'https://meldiq.app/downloads/windows/0.2.0/fixture/Meldiq-Setup-0.2.0-x64.exe', filename: 'Meldiq-Setup-0.2.0-x64.exe', size: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), sha512: createHash('sha512').update(bytes).digest('base64') } };
}
function envelope(value = release(), key = pair.privateKey) {
  const payload = Buffer.from(JSON.stringify(value));
  return JSON.stringify({ payload: payload.toString('base64'), signatures: [{ keyId: keys[0].keyId, signature: sign(null, Buffer.concat([Buffer.from('MELDIQ-DESKTOP-UPDATE-V1\n'), payload]), key).toString('base64') }] });
}
const options = { keys, channel: 'stable' as const, appId: 'app.meldiq.desktop', baseUrl: 'https://meldiq.app/desktop-updates', now };
const directories: string[] = [];
afterEach(() => { vi.unstubAllGlobals(); for (const d of directories.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });
function trust() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'meldiq-update-trust-')); directories.push(dir);
  return { dir, config: { keys, appId: options.appId, checkpointFile: path.join(dir, 'checkpoint.json') }, instance: new SignedReleaseTrust({ keys, appId: options.appId, checkpointFile: path.join(dir, 'checkpoint.json') }, options.baseUrl, 'stable') };
}
describe('release-key authentication', () => {
  it('accepts a valid pinned Ed25519 release', () => expect(verifyReleaseEnvelope(envelope(), options).release.version).toBe('0.2.0'));
  it('rejects modified metadata even when its file checksum is replaced', () => {
    const parsed = JSON.parse(envelope()); const payload = release(); payload.file.sha256 = '0'.repeat(64);
    parsed.payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    expect(() => verifyReleaseEnvelope(JSON.stringify(parsed), options)).toThrow(/signature/);
  });
  it('rejects another signing key and an unsigned envelope', () => {
    expect(() => verifyReleaseEnvelope(envelope(release(), generateKeyPairSync('ed25519').privateKey), options)).toThrow(/signature/);
    const parsed = JSON.parse(envelope()); parsed.signatures = [];
    expect(() => verifyReleaseEnvelope(JSON.stringify(parsed), options)).toThrow();
  });
  it.each([
    ['wrong app', (r: SignedRelease) => { r.appId = 'another-app'; }],
    ['wrong channel', (r: SignedRelease) => { r.channel = 'beta'; }],
    ['expired', (r: SignedRelease) => { r.expiresAt = new Date(now - 1).toISOString(); }],
    ['future issue time', (r: SignedRelease) => { r.releasedAt = new Date(now + 900000).toISOString(); }],
    ['excessive expiry', (r: SignedRelease) => { r.expiresAt = new Date(now + 181 * 86400000).toISOString(); }],
    ['stable prerelease', (r: SignedRelease) => { r.version = '0.2.0-beta.1'; }],
    ['invalid size', (r: SignedRelease) => { r.file.size = 0; }],
    ['invalid checksum', (r: SignedRelease) => { r.file.sha512 = 'not a checksum'; }],
    ['HTTP artifact', (r: SignedRelease) => { r.file.url = r.file.url.replace('https:', 'http:'); }],
    ['other host', (r: SignedRelease) => { r.file.url = r.file.url.replace('meldiq.app', 'untrusted.example'); }],
    ['URL credentials', (r: SignedRelease) => { r.file.url = r.file.url.replace('https://', 'https://user:pass@'); }],
    ['query string', (r: SignedRelease) => { r.file.url += '?token=value'; }],
    ['wrong filename', (r: SignedRelease) => { r.file.filename = 'other.exe'; }],
    ['wrong version path', (r: SignedRelease) => { r.file.url = r.file.url.replace('/0.2.0/', '/0.1.0/'); }],
  ])('rejects authenticated but unsafe metadata: %s', (_name, mutate) => {
    const r = release(); mutate(r); expect(() => verifyReleaseEnvelope(envelope(r), options)).toThrow();
  });
  it('binds signatures to the update protocol domain', () => {
    const parsed = JSON.parse(envelope()); parsed.signatures[0].signature = sign(null, Buffer.from(parsed.payload, 'base64'), pair.privateKey).toString('base64');
    expect(() => verifyReleaseEnvelope(JSON.stringify(parsed), options)).toThrow(/signature/);
  });
  it('rejects stale and same-sequence conflicting releases across restarts', () => {
    const t = trust(), newer = release(); newer.sequence = 2; t.instance.accept(envelope(newer));
    const restarted = new SignedReleaseTrust(t.config, options.baseUrl, 'stable');
    expect(() => restarted.accept(envelope())).toThrow(/Replayed/);
    newer.file.sha256 = '0'.repeat(64);
    expect(() => restarted.accept(envelope(newer))).toThrow(/conflicting/);
  });
  it('revalidates downloaded bytes before installation', async () => {
    const t = trust(); t.instance.accept(envelope()); const filename = path.join(t.dir, 'update.exe'); fs.writeFileSync(filename, bytes);
    expect(await t.instance.verifyFile(filename)).toBeNull();
    fs.writeFileSync(filename, Buffer.alloc(bytes.length));
    expect(await t.instance.verifyFile(filename)).toMatch(/bytes/);
  });
  it('refuses downloads before an authenticated manifest exists', async () => {
    const t = trust(); expect(await t.instance.verifyFile(path.join(t.dir, 'missing.exe'))).toMatch(/authenticated/);
  });
  it('requests only the configured HTTPS manifest without following redirects', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(envelope(), { headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetcher); const t = trust(); expect((await t.instance.fetchRelease()).version).toBe('0.2.0');
    expect(fetcher.mock.calls[0][0]).toBe('https://meldiq.app/desktop-updates/windows/stable/release.json');
    expect(fetcher.mock.calls[0][1].redirect).toBe('error');
  });
  it('rejects oversized and corrupt feed bodies without replacing accepted trust state', async () => {
    const t = trust(); t.instance.accept(envelope());
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('x'.repeat(131073))));
    await expect(t.instance.fetchRelease()).rejects.toThrow(/size/);
    expect(t.instance.release.version).toBe('0.2.0');
  });
});
