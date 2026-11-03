import { describe, it, expect, vi } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DEFAULT_PREFERENCES, performanceProfile, validatePreferences, parseDeepLink, externalUrl, validateTokens, isLocalPage } from '../shared/policy';
import { PreferenceStore } from '../main/preferences';
vi.mock('electron', () => ({ net: {} }));
import { localAsset, contentSecurityPolicy, webConnectionOrigins } from '../main/protocol';
describe('Hardware adaptation', () => {
  it.each([4,8])('keeps %i GB devices in economy mode without blocking messaging', ram => {
    const profile = performanceProfile(ram * 1024 ** 3, 2, DEFAULT_PREFERENCES);
    expect(profile.mode).toBe('economy'); expect(profile.reducedEffects).toBe(true);
    expect(profile).not.toHaveProperty('blocked');
  });
  it('uses balanced on mid-range hardware and honors economy override', () => {
    expect(performanceProfile(16 * 1024 ** 3, 8, DEFAULT_PREFERENCES).mode).toBe('balanced');
    expect(performanceProfile(32 * 1024 ** 3, 16, { ...DEFAULT_PREFERENCES, performance: 'economy' }).mode).toBe('economy');
  });
});
describe('Untrusted inputs', () => {
  it.each([{ cacheMB: -1 }, { performance: 'ultra' }, { apiOrigin: 'https://evil.test' }, { __proto__: null, arbitrary: true }, null, []])('rejects invalid preferences %j', input => expect(() => validatePreferences(input)).toThrow());
  it.each(['javascript:alert(1)', 'file:///etc/passwd', 'http://example.com', 'https://user:pass@example.com', 'https://example.com:8080', 'https://example.com\n'])('rejects external URL %s', url => expect(externalUrl(url)).toBeNull());
  it('allows normal HTTPS links for user-confirmed browser opening', () => expect(externalUrl('https://example.com/path?q=1')).toBe('https://example.com/path?q=1'));
  it.each(['meldiq://settings/about?url=https://evil.test', 'meldiq://home/%2e%2e/settings', 'meldiq://home/%2fapi', 'meldiq://evil.test/home', 'https://web.meldiq.app/home', 'meldiq://home#script', 'meldiq://user@home'])('rejects malicious deep link %s', url => expect(parseDeepLink(url)).toBeNull());
  it('routes validated message and setting deep links', () => {
    expect(parseDeepLink('meldiq://dms/c/abc/details')).toEqual({ kind: 'navigate', href: '/dms/c/abc/details' });
    expect(parseDeepLink('meldiq://settings/account')).toEqual({ kind: 'navigate', href: '/settings/account' });
  });
  it('adapts native community invitations to the existing web join workflow', () => {
    expect(parseDeepLink('meldiq://invite/ABCD-EFGH')).toEqual({ kind: 'navigate', href: '/join/ABCD-EFGH' });
    expect(parseDeepLink('meldiq://invite/x')).toBeNull();
  });
  it('validates one-use native social receipts without allowing token injection', () => {
    const id = 'a'.repeat(43), receipt = 'b'.repeat(43);
    expect(parseDeepLink(`meldiq://auth/callback#id=${id}&receipt=${receipt}`)).toEqual({ kind: 'social', id, receipt, error: null });
    expect(parseDeepLink(`meldiq://auth/callback#id=${id}&receipt=${receipt}&accessToken=bad`)).toBeNull();
    expect(parseDeepLink(`meldiq://auth/callback#id=${id}&receipt=${receipt}&error=cancelled`)).toBeNull();
  });
  it('limits privileged documents to local application routes', () => {
    expect(isLocalPage('https://web.meldiq.app/settings/account')).toBe(true);
    expect(isLocalPage('https://web.meldiq.app/v2/evil')).toBe(false);
    expect(isLocalPage('https://example.com/settings/account')).toBe(false);
  });
  it('rejects oversized or malformed session payloads', () => {
    expect(() => validateTokens({ accessToken: 'a'.repeat(17000) })).toThrow();
    expect(() => validateTokens({ accessToken: 'a', accessTokenExpiresAt: NaN, refreshToken: 'b', refreshTokenExpiresAt: 1, sessionId: 's' })).toThrow();
  });
});
describe('Local renderer files', () => {
  it('only adopts exact HTTPS connection origins from the web policy', () => {
    expect(webConnectionOrigins("script-src https://script.example; connect-src 'self' https://media.example https://*.other.example https: https://bad.example/path wss://other.example")).toEqual(['https://media.example']);
    expect(webConnectionOrigins(null)).toEqual([]);
  });
  const files = new Set(['index.html', 'assets/app.js']);
  it('allows only manifest files and known application routes', () => {
    expect(localAsset('/bundle', '/assets/app.js', files)).toBe(path.join('/bundle','assets/app.js'));
    expect(localAsset('/bundle', '/settings/account', files)).toBe(path.join('/bundle','index.html'));
    expect(localAsset('/bundle', '/unknown', files)).toBeNull();
  });
  it.each(['/../secret', '/%2e%2e/secret', '/assets/%5csecret', '/assets/%00secret', '/%invalid'])('rejects path escape %s', p => expect(localAsset('/bundle', p, files)).toBeNull());
  it('does not permit arbitrary network script execution or unsafe-eval', () => {
    const csp = contentSecurityPolicy({ apiOrigin: 'https://web.meldiq.app', websocketUrl: 'wss://web.meldiq.app/v1/ws', connectOrigins: [] });
    expect(csp).toContain("object-src 'none'"); expect(csp).not.toContain('unsafe-eval');
    expect(csp).not.toContain('script-src https:');
  });
});
describe('Preference persistence', () => {
  it('recovers a corrupt file and atomically preserves valid settings', () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'meldiq-prefs-'));
    try {
      const file = path.join(dir,'prefs.json'); writeFileSync(file,'{broken');
      const store = new PreferenceStore(file); expect(store.value).toEqual(DEFAULT_PREFERENCES);
      store.patch({ cacheMB: 128, closeToTray: false });
      expect(JSON.parse(readFileSync(file,'utf8')).cacheMB).toBe(128);
      expect(new PreferenceStore(file).value.closeToTray).toBe(false);
      expect(() => store.patch({ cacheMB: 999 })).toThrow();
      expect(store.value.cacheMB).toBe(128);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});
