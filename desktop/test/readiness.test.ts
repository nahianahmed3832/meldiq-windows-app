import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { PermissionStore, mediaCapabilities } from '../main/permissions';
import { restoreWindow } from '../shared/window-state';
import { checkoutReturn, discordAuthorization } from '../shared/browser-flows';
import { parseDeepLink } from '../shared/policy';
const state = 's'.repeat(43), id = 'i'.repeat(43), receipt = 'r'.repeat(43);
const authorization = (overrides: Record<string, string> = {}) => 'https://discord.com/oauth2/authorize?' + new URLSearchParams({ client_id: '123456789', state, response_type: 'code', scope: 'bot identify guilds', redirect_uri: 'https://web.meldiq.app/discord/callback', ...overrides });
describe('Windows window restoration', () => {
  const primary = { x: 0, y: 0, width: 1280, height: 720 }, secondary = { x: -2560, y: 0, width: 2560, height: 1440 };
  it('keeps a large window on its secondary monitor and restores maximize intent', () => expect(restoreWindow({ bounds: { x: -2400, y: 80, width: 1800, height: 1000 }, maximized: true }, [primary, secondary])).toEqual({ bounds: { x: -2400, y: 80, width: 1800, height: 1000 }, maximized: true }));
  it('recovers an unplugged display onto the remaining work area', () => expect(restoreWindow({ x: -2500, y: 20, width: 1800, height: 1000 }, [primary]).bounds).toEqual(primary));
  it.each([null, {}, { x: NaN, y: 0, width: 2, height: 2 }, { x: 1, y: 1, width: -1, height: 10 }])('handles corrupt/legacy bounds %j', raw => expect(restoreWindow(raw, [primary]).bounds).toEqual(primary));
  it('fits a small work area instead of extending below the taskbar', () => expect(restoreWindow(null, [{ x: 100, y: 40, width: 800, height: 500 }]).bounds).toEqual({ x: 100, y: 40, width: 800, height: 500 }));
});
describe('persistent least-privilege device decisions', () => {
  const setup = () => { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'meldiq-permission-')); return { dir, filename: path.join(dir, 'permissions.json') }; };
  it('persists denial and approval separately, and requires explicit reset', async () => {
    const { dir, filename } = setup();
    try {
      let store = new PermissionStore(filename); const ask = vi.fn(async () => true);
      expect(await store.request(['microphone'], ask)).toBe(true);
      expect(await store.request(['camera'], async () => false)).toBe(false);
      store = new PermissionStore(filename);
      expect(await store.request(['microphone'], ask)).toBe(true);
      expect(await store.request(['camera'], ask)).toBe(false);
      expect(ask).toHaveBeenCalledTimes(1);
      store.reset(); expect(await store.request(['camera'], ask)).toBe(true);
      expect(ask).toHaveBeenCalledTimes(2);
    } finally { fs.rmSync(dir, { recursive: true }); }
  });
  it('coalesces duplicate concurrent requests and does not restore a decision after reset', async () => {
    const { dir, filename } = setup();
    try {
      const store = new PermissionStore(filename); let answer!: (allow: boolean) => void;
      const ask = vi.fn(() => new Promise<boolean>(resolve => { answer = resolve; }));
      const a = store.request(['camera', 'microphone'], ask), b = store.request(['microphone', 'camera'], ask);
      await Promise.resolve(); expect(ask).toHaveBeenCalledTimes(1);
      store.reset(); answer(true); expect(await a).toBe(false); expect(await b).toBe(false); expect(store.value).toEqual({});
    } finally { fs.rmSync(dir, { recursive: true }); }
  });
  it('denies unknown or empty capability requests', () => { expect(mediaCapabilities(undefined)).toEqual([]); expect(mediaCapabilities(['audio', 'video'])).toEqual(['microphone', 'camera']); expect(mediaCapabilities(['audio', 'unknown'])).toEqual([]); });
});
describe('provider return policy', () => {
  it.each(['https://web.meldiq.app/settings/checkout?token=untrusted', 'https://web.meldiq.app/settings/billing', 'https://web.meldiq.app/settings/spark'])('accepts only application-owned checkout landing routes: %s', url => expect(checkoutReturn(url)).toEqual({ canceled: false }));
  it.each(['https://evil.test/settings/checkout', 'https://web.meldiq.app.evil.test/settings/checkout', 'https://web.meldiq.app/settings/checkout/evil', 'https://user@web.meldiq.app/settings/checkout', 'http://web.meldiq.app/settings/checkout', 'https://web.meldiq.app/settings/checkout#token'])('rejects unsafe checkout return %s', url => expect(checkoutReturn(url)).toBeNull());
  it('marks cancellation as a status refresh, never as payment success', () => expect(checkoutReturn('https://web.meldiq.app/settings/checkout?checkout=canceled')).toEqual({ canceled: true }));
  it('accepts the exact official Discord flow and rejects a substituted redirect or scope', () => { expect(discordAuthorization(authorization())?.state).toBe(state); expect(discordAuthorization(authorization({ redirect_uri: 'https://evil.test/' }))).toBeNull(); expect(discordAuthorization(authorization({ scope: 'bot email' }))).toBeNull(); expect(discordAuthorization(authorization({ state: 'short' }))).toBeNull(); });
  it('rejects duplicate/native credential injection and validates cancellation', () => {
    expect(parseDeepLink(`meldiq://discord/callback#state=${state}&code=one-use&guild_id=123456789`)).toEqual({ kind: 'discord', state, code: 'one-use', guildId: '123456789', canceled: false });
    expect(parseDeepLink(`meldiq://discord/callback#state=${state}&error=access_denied`)).toEqual({ kind: 'discord', state, code: null, guildId: null, canceled: true });
    for (const extra of ['&access_token=secret', '&state=duplicate', '&error=access_denied', '&guild_id=invalid']) expect(parseDeepLink(`meldiq://discord/callback#state=${state}&code=one-use${extra}`)).toBeNull();
  });
});
/** Runs actual shipped browser code with a deterministic isolated browser surface. */
function browserScript(file: string, fragment: string, pending: unknown = null) {
  const storage = new Map<string, string>(); if (pending) storage.set('meldiq.desktop.browserFlow', JSON.stringify(pending));
  const nodes: Record<string, { textContent: string; hidden: boolean; href: string; focus: () => void }> = {};
  const replace = vi.fn(); const clearAddress = vi.fn();
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), {
    URL, URLSearchParams, Date, JSON,
    location: { origin: 'https://web.meldiq.app', pathname: '/desktop-bridge.html', hash: '#' + fragment, replace },
    history: { replaceState: clearAddress },
    sessionStorage: { setItem: (key: string, value: string) => storage.set(key, value), getItem: (key: string) => storage.get(key) ?? null, removeItem: (key: string) => storage.delete(key) },
    document: { getElementById: (key: string) => nodes[key] ??= { textContent: '', hidden: true, href: '', focus: vi.fn() } },
    window: { opener: null, addEventListener: vi.fn() },
  });
  return { nodes, replace, storage, clearAddress };
}
describe('shipped browser handoff', () => {
  const file = 'packages/web/public/desktop-bridge.js';
  it('stores the expected social flow before opening the existing backend authorization route', () => {
    const result = browserScript(file, `kind=social&id=${id}`);
    expect(result.replace).toHaveBeenCalledWith(`/v2/auth/social/authorize/${id}`);
    expect(JSON.parse(result.storage.get('meldiq.desktop.browserFlow')!)).toMatchObject({ kind: 'social', id });
    expect(result.clearAddress).toHaveBeenCalledWith(null, '', '/desktop-bridge.html');
  });
  it('returns a short-lived receipt through an explicit user link and clears pending state', () => {
    const result = browserScript(file, `kind=social-return&id=${id}&receipt=${receipt}`, { kind: 'social', id, expires: Date.now() + 60_000 });
    expect(result.nodes.open.href).toBe(`meldiq://auth/callback#id=${id}&receipt=${receipt}`);
    expect(result.nodes.open.hidden).toBe(false); expect(result.storage.size).toBe(0);
    expect(result.replace).not.toHaveBeenCalled();
  });
  it.each([null, { kind: 'social', id: 'other', expires: Date.now() + 1000 }, { kind: 'social', id, expires: 1 }])('rejects unsolicited/mismatched/expired social receipt %j', pending => {
    const result = browserScript(file, `kind=social-return&id=${id}&receipt=${receipt}`, pending);
    expect(result.nodes.open).toBeUndefined(); expect(result.replace).not.toHaveBeenCalled();
  });
  it('rejects long-lived credentials and duplicate fields', () => {
    for (const extra of ['&refreshToken=secret', '&receipt=duplicate']) {
      const result = browserScript(file, `kind=social-return&id=${id}&receipt=${receipt}${extra}`, { kind: 'social', id, expires: Date.now() + 1000 });
      expect(result.nodes.open).toBeUndefined();
    }
  });
  it('opens only the official Discord authorization and binds the return to its state', () => {
    const start = browserScript(file, new URLSearchParams({ kind: 'discord', url: authorization() }).toString());
    expect(start.replace).toHaveBeenCalledWith(authorization());
    const result = browserScript(file, `kind=discord-return&state=${state}&code=short-lived`, { kind: 'discord', state, expires: Date.now() + 60_000 });
    expect(parseDeepLink(result.nodes.open.href)).toMatchObject({ kind: 'discord', state, code: 'short-lived' });
  });
  it('does not make a native handoff for a different Discord state', () => {
    const result = browserScript(file, `kind=discord-return&state=${state}&code=short-lived`, { kind: 'discord', state: 'x'.repeat(43), expires: Date.now() + 60_000 });
    expect(result.nodes.open).toBeUndefined();
  });
  it('preserves the existing web callback while routing only a desktop-initiated social flow', () => {
    const result = browserScript('packages/web/public/social-auth-callback.js', `id=${id}&receipt=${receipt}`, { kind: 'social', id, expires: Date.now() + 60_000 });
    expect(result.replace).toHaveBeenCalledWith(`/desktop-bridge.html#kind=social-return&id=${id}&receipt=${receipt}`);
  });
});
