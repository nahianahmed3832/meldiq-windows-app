import { ORIGIN } from './policy';
export const BROWSER_BRIDGE_VERSION = 1;
export function checkoutReturn(raw: string): { canceled: boolean } | null {
  try {
    const u = new URL(raw);
    if (u.origin !== ORIGIN || u.username || u.password || u.hash || !['/settings/checkout', '/settings/mojo', '/settings/billing', '/settings/spark'].includes(u.pathname)) return null;
    return { canceled: u.searchParams.get('checkout') === 'canceled' || u.searchParams.get('gift') === 'canceled' };
  } catch { return null; }
}
export function discordAuthorization(raw: unknown): { url: string; state: string } | null {
  if (typeof raw !== 'string' || raw.length > 4096) return null;
  try {
    const u = new URL(raw), q = u.searchParams;
    if (u.origin !== 'https://discord.com' || u.username || u.password || u.hash || u.pathname !== '/oauth2/authorize' || [...q.keys()].length !== new Set(q.keys()).size) return null;
    const state = q.get('state') ?? '';
    const redirect = new URL(q.get('redirect_uri') ?? '');
    const scopes = (q.get('scope') ?? '').split(' ');
    if (!/^[A-Za-z0-9_-]{43}$/.test(state) || q.get('response_type') !== 'code' || !/^\d{5,25}$/.test(q.get('client_id') ?? '') || redirect.href !== `${ORIGIN}/discord/callback` || !scopes.length || scopes.some(s => !['bot', 'identify', 'guilds'].includes(s))) return null;
    return { url: u.href, state };
  } catch { return null; }
}
