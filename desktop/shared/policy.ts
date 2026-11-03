import type { AccountTokens, PerformanceProfile, Preferences } from './contracts';
export const ORIGIN = 'https://web.meldiq.app';
export const DEFAULT_PREFERENCES: Preferences = {
  performance: 'auto', cacheMB: 256, hardwareAcceleration: true,
  closeToTray: true, startAtLogin: false, notifications: true,
  updateMode: 'automatic', channel: 'stable',
};
const options: Record<string, readonly unknown[]> = {
  performance: ['auto', 'balanced', 'economy'], cacheMB: [128, 256, 512],
  hardwareAcceleration: [true, false], closeToTray: [true, false],
  startAtLogin: [true, false], notifications: [true, false],
  updateMode: ['automatic', 'ask', 'manual'], channel: ['stable', 'beta', 'canary'],
};
export function validatePreferences(input: unknown): Partial<Preferences> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid preferences');
  for (const [key, value] of Object.entries(input)) {
    if (!Object.hasOwn(options, key) || !options[key].includes(value)) throw new Error('Invalid preference value');
  }
  return input as Partial<Preferences>;
}
export function performanceProfile(ramBytes: number, logicalCpus: number, p: Preferences): PerformanceProfile {
  const economy = p.performance === 'economy' || (p.performance === 'auto' && (ramBytes < 9 * 1024 ** 3 || logicalCpus <= 2));
  return { mode: economy ? 'economy' : 'balanced', ramGB: Math.round(ramBytes / 1024 ** 3), logicalCpus, reducedEffects: economy, hardwareAcceleration: p.hardwareAcceleration };
}
export function isLocalPage(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.origin === ORIGIN && !u.username && !u.password && isAppPath(u.pathname);
  } catch { return false; }
}
export function isAppPath(path: string): boolean {
  return path === '/' || /^\/(home|dms|friends|activity|later|discover|settings|workspace|oauth|lobby|invite|join|m|template|ref)(\/[A-Za-z0-9_%@.-]+)*\/?$/.test(path) && path.length <= 600;
}
export function externalUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length > 4096 || [...raw].some(c => c.charCodeAt(0) <= 32 || c.charCodeAt(0) === 127)) return null;
  try {
    const u = new URL(raw);
    if (u.username || u.password || u.port && u.port !== '443') return null;
    // User-content links are confirmed by a native dialog; protocol and destination are validated again here.
    return u.protocol === 'https:' && u.hostname.includes('.') ? u.href : null;
  } catch { return null; }
}
export type DiscordCallback = { kind: 'discord'; state: string; code: string | null; guildId: string | null; canceled: boolean };
export type DeepLink = DiscordCallback | { kind: 'navigate'; href: string } | { kind: 'social'; id: string; receipt: string | null; error: string | null };
export function parseDeepLink(raw: unknown): DeepLink | null {
  if (typeof raw !== 'string' || raw.length > 2048 || [...raw].some(c => c.charCodeAt(0) <= 32 || c.charCodeAt(0) === 127) || raw.includes('\\') || /%2e|%2f|%5c|\/\.\.?\//i.test(raw)) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== 'meldiq:' || u.username || u.password || u.port) return null;
    if (u.hostname === 'discord' && u.pathname === '/callback' && !u.search) {
      const q = new URLSearchParams(u.hash.slice(1));
      if ([...q.keys()].some(k => !['state', 'code', 'guild_id', 'error'].includes(k)) || [...q.keys()].length !== new Set(q.keys()).size) return null;
      const state = q.get('state') ?? '', code = q.get('code'), guildId = q.get('guild_id'), error = q.get('error');
      if (!/^[A-Za-z0-9_-]{43}$/.test(state) || (code !== null && !/^[A-Za-z0-9._~-]{1,200}$/.test(code)) || (guildId !== null && !/^\d{5,25}$/.test(guildId)) || (error !== null && error !== 'access_denied') || Boolean(code) === Boolean(error) || (error && guildId)) return null;
      return { kind: 'discord', state, code, guildId, canceled: error === 'access_denied' };
    }
    if (u.hostname === 'auth' && u.pathname === '/callback' && !u.search) {
      const q = new URLSearchParams(u.hash.slice(1));
      const id = q.get('id') ?? '', receipt = q.get('receipt'), error = q.get('error');
      if ([...q.keys()].some(k => !['id', 'receipt', 'error'].includes(k)) || [...q.keys()].length !== new Set(q.keys()).size) return null;
      if (!/^[\w-]{43}$/.test(id) || (receipt !== null && !/^[\w-]{43}$/.test(receipt)) || (error !== null && !['cancelled', 'verification_failed'].includes(error)) || Boolean(receipt) === Boolean(error)) return null;
      return { kind: 'social', id, receipt, error };
    }
    let href = `/${u.hostname}${u.pathname}`.replace(/\/$/, '');
    if (u.hostname === 'invite') {
      if (!/^\/[A-Za-z0-9-]{4,40}$/.test(u.pathname)) return null;
      href = `/join${u.pathname}`;
    }
    if (!isAppPath(href) || u.hash || u.search || /%2f|%5c|%2e/i.test(href)) return null;
    return { kind: 'navigate', href };
  } catch { return null; }
}
export function validateTokens(raw: unknown): AccountTokens {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid session');
  const t = raw as Record<string, unknown>;
  if (Object.keys(t).sort().join(',') !== 'accessToken,accessTokenExpiresAt,refreshToken,refreshTokenExpiresAt,sessionId') throw new Error('Invalid session fields');
  for (const key of ['accessToken', 'refreshToken', 'sessionId']) if (typeof t[key] !== 'string' || !t[key] || (t[key] as string).length > 16384) throw new Error('Invalid session token');
  for (const key of ['accessTokenExpiresAt', 'refreshTokenExpiresAt']) if (typeof t[key] !== 'number' || !Number.isSafeInteger(t[key]) || (t[key] as number) < 0) throw new Error('Invalid session expiry');
  return t as unknown as AccountTokens;
}
