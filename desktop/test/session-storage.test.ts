import 'fake-indexeddb/auto';
import { it, expect, vi } from 'vitest';
import { LocalStore } from '../../packages/web/src/store/db';
import { TokenVault } from '../../packages/web/src/auth/tokenVault';
import { importLegacyHistory } from '../../packages/web/src/sync/legacyImport';
import type { EngineContext } from '../../packages/web/src/sync/context';
const tokens = { accessToken: 'test-access', accessTokenExpiresAt: 1000, refreshToken: 'test-refresh', refreshTokenExpiresAt: 2000, sessionId: 'test-session' };
it('restores the OS-sealed session after closing and reopening the account database, then clears it', async () => {
  const opaque = 'opaque-test-OS-sealed-session';
  vi.stubGlobal('window', { meldiqDesktop: { sealSession: vi.fn(async () => opaque), openSession: vi.fn(async (sealed: string) => { expect(sealed).toBe(opaque); return tokens; }) } });
  let store = await LocalStore.open('desktop-persist-test');
  try {
    await new TokenVault(store).save(tokens);
    const raw = await store.legacy.get('kv', 'desktopSealedTokens');
    expect(raw).toBe(opaque);
    expect(JSON.stringify(raw)).not.toContain(tokens.refreshToken);
    expect(await store.legacy.get('kv', 'accountTokens')).toBeUndefined();
    await importLegacyHistory({ store, device: { history: null }, api: { json: vi.fn() } } as unknown as EngineContext);
    expect(await store.legacy.get('kv', 'desktopSealedTokens')).toBe(opaque);
    store.close();
    store = await LocalStore.open('desktop-persist-test');
    expect(await new TokenVault(store).load()).toEqual(tokens);
    await new TokenVault(store).clear();
    store.close(); store = await LocalStore.open('desktop-persist-test');
    expect(await new TokenVault(store).load()).toBeNull();
  } finally { store.close(); vi.unstubAllGlobals(); }
});
it('does not persist a plaintext fallback when OS storage rejects sealing', async () => {
  vi.stubGlobal('window', { meldiqDesktop: { sealSession: async () => { throw new Error('Secure storage unavailable'); } } });
  const store = await LocalStore.open('desktop-storage-failure-test');
  try {
    await expect(new TokenVault(store).save(tokens)).rejects.toThrow('Secure storage unavailable');
    expect(await store.legacy.get('kv', 'desktopSealedTokens')).toBeUndefined();
    expect(await store.legacy.get('kv', 'accountTokens')).toBeUndefined();
  } finally { store.close(); vi.unstubAllGlobals(); }
});
