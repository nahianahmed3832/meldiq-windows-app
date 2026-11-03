// Initiates expiring PKCE login flows only. Never submits account credentials or completes a grant.
import fs from 'node:fs/promises';
import { randomBytes, createHash } from 'node:crypto';
if (!process.argv.includes('--start')) throw new Error('Pass --start to create two expiring production authorization flows');
const origin = 'https://web.meldiq.app';
const config = await (await fetch(origin + '/v2/auth/social/config', { signal: AbortSignal.timeout(15000) })).json();
const results = [];
for (const provider of ['google', 'discord']) {
  if (!config.providers.includes(provider)) throw new Error('Provider unavailable: ' + provider);
  const challenge = createHash('sha256').update(randomBytes(32).toString('base64url')).digest('base64url');
  const r = await fetch(origin + '/v2/auth/social/start', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ provider, challenge, platform: 'web', mode: 'login' }), signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error('Live sign-in start failed for ' + provider + ': HTTP ' + r.status);
  const flow = await r.json();
  const started = new URL(flow.authorizeUrl);
  if (started.origin !== origin || started.pathname !== '/v2/auth/social/authorize/' + flow.id) throw new Error('Unexpected authorization address');
  let url = started, reachedProvider = false;
  const chain = [];
  for (let count = 0; count < 5; count++) {
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(20000) });
    chain.push({ host: url.hostname, path: url.pathname.replace(/(\/v2\/auth\/social\/authorize\/)\w[\w-]+$/, '$1:flow'), status: response.status });
    const target = response.headers.get('location');
    await response.body?.cancel();
    if (![302, 303, 307, 308].includes(response.status) || !target) break;
    const next = new URL(target, url);
    if (next.protocol !== 'https:' || next.username || next.password) throw new Error('Unsafe sign-in redirect');
    const approved = provider === 'google' ? next.hostname === 'accounts.google.com' : next.hostname === 'discord.com';
    if (approved) {
      reachedProvider = true;
      chain.push({ host: next.hostname, path: next.pathname, officialProviderAuthorization: true, statePresent: Boolean(next.searchParams.get('state')), clientIdPresent: Boolean(next.searchParams.get('client_id')) });
      break;
    }
    if (!(next.origin === origin || next.hostname.endsWith('.supabase.co'))) throw new Error('Unexpected intermediary host');
    url = next;
  }
  if (!reachedProvider) throw new Error('Official ' + provider + ' authorization was not reached: ' + JSON.stringify(chain));
  results.push({ provider, officialAuthorizationReached: true, chain, expiresAt: flow.expiresAt });
}
const report = { checkedAt: new Date().toISOString(), scope: 'production PKCE start and server redirects to official provider only; no credentials, consent, account creation or session completion', buyerOrProviderApproval: false, results, counts: { passed: results.length, failed: 0 } };
await fs.mkdir('test-results', { recursive: true });
await fs.writeFile('test-results/live-signin-start.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
