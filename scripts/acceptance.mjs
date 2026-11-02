import fs from 'node:fs/promises';
import path from 'node:path';
import { loadAcceptance, requiredFields } from './acceptance-config.mjs';

const args = process.argv.slice(2);
const envIndex = args.indexOf('--env');
const modeIndex = args.indexOf('--mode');
const mode = modeIndex < 0 ? 'preflight' : args[modeIndex + 1];
if (!['preflight', 'discover'].includes(mode)) throw new Error('Acceptance mode must be preflight or discover');
const config = loadAcceptance(envIndex < 0 ? undefined : args[envIndex + 1]);
const required = ['API_ORIGIN', 'WS_URL', 'APP_ORIGIN', 'MEDIA_ORIGIN', 'LIVEKIT_URL', 'OWNER_REFERENCE', 'QA_COMMUNITY_ID', 'QA_CHANNEL_ID', ...['A', 'B', 'C'].flatMap(a => [`QA_${a}_EMAIL`, `QA_${a}_PASSWORD`, `QA_${a}_USER_ID`])];
const report = {
  schema: 1, checkedAt: new Date().toISOString(), mode, scope: 'Production setup only; no account creation, transactions or customer-data mutations',
  missing: requiredFields(config, required),
  gates: {
    originsApproved: config.MELDIQ_ACCEPTANCE_ORIGINS_APPROVED === 'true',
    dedicatedQaAuthorized: config.MELDIQ_ACCEPTANCE_QA_AUTHORIZED === 'true' && !!config.MELDIQ_ACCEPTANCE_OWNER_REFERENCE,
    isolatedPaymentSandbox: config.MELDIQ_ACCEPTANCE_SANDBOX_ISOLATED === 'true' && !!config.MELDIQ_ACCEPTANCE_SANDBOX_API_ORIGIN && ['sandbox', 'test'].includes(config.MELDIQ_ACCEPTANCE_PAYMENT_MODE),
  }, probes: [],
};
if (mode === 'discover') {
  const missing = requiredFields(config, ['API_ORIGIN', 'WS_URL', 'APP_ORIGIN']);
  if (missing.length) throw new Error(`Missing public acceptance fields: ${missing.join(', ')}`);
  // Fixed existing public contracts. No auth headers, redirect following, SDK secrets or checkout creation.
  for (const route of ['/v1/server-info', '/v2/auth/social/config', '/v2/billing/plans', '/v2/billing/promotions/preference']) {
    const item = { route, method: 'GET', status: null };
    try {
      const response = await fetch(new URL(route, config.MELDIQ_ACCEPTANCE_API_ORIGIN), { headers: { Accept: 'application/json', Origin: config.MELDIQ_ACCEPTANCE_APP_ORIGIN }, redirect: 'manual', signal: AbortSignal.timeout(15000) });
      item.status = response.status;
      item.headers = Object.fromEntries(['server', 'content-type', 'cf-ray', 'cf-mitigated', 'access-control-allow-origin'].map(k => [k, response.headers.get(k)]).filter(([, v]) => v));
      const json = await response.json().catch(() => null);
      if (json && response.ok) {
        if (route.endsWith('server-info')) item.info = Object.fromEntries(['version', 'api', 'minClientApi', 'calling', 'fileMaxBytes', 'features'].filter(k => Object.hasOwn(json, k)).map(k => [k, json[k]]));
        if (route.endsWith('social/config')) item.info = { providers: json.providers, authorizeOrigin: json.authorizeOrigin };
        if (route.endsWith('billing/plans')) item.info = { available: json.available, mode: json.mode, planCount: Array.isArray(json.plans) ? json.plans.length : null };
      }
      // Never serialize arbitrary bodies, credentials, cookies or redirect/signed URLs.
      if (json && !response.ok) item.error = Object.fromEntries(['error_code', 'error_name', 'error_category', 'cloudflare_error', 'owner_action_required'].filter(k => typeof json[k] === 'string' || typeof json[k] === 'boolean' || typeof json[k] === 'number').map(k => [k, String(json[k]).slice(0, 120)]));
    } catch { item.error = 'Network, timeout or response failure; no raw diagnostics retained'; }
    report.probes.push(item);
  }
  try {
    const response = await fetch(new URL('/v2/auth/login', config.MELDIQ_ACCEPTANCE_API_ORIGIN), { method: 'OPTIONS', redirect: 'manual', signal: AbortSignal.timeout(15000), headers: { Origin: config.MELDIQ_ACCEPTANCE_APP_ORIGIN, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type,x-meldiq-client' } });
    report.probes.push({ route: '/v2/auth/login', method: 'OPTIONS', status: response.status, allowedOrigin: response.headers.get('access-control-allow-origin'), allowedHeaders: response.headers.get('access-control-allow-headers') });
  } catch { report.probes.push({ route: '/v2/auth/login', method: 'OPTIONS', status: null, error: 'Preflight unreachable' }); }
}
report.setupReady = report.missing.length === 0 && Object.values(report.gates).every(Boolean);
report.publicContractsReachable = mode === 'discover' && report.probes.filter(p => p.method === 'GET').every(p => p.status === (p.route === '/v2/billing/promotions/preference' ? 401 : 200));
report.productionAccepted = false; // Calls, media, Windows, cross-device, payments and signed updates need separate evidence.
await fs.mkdir('test-results', { recursive: true });
const output = path.resolve(`test-results/acceptance-${mode}.json`);
await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n', { mode: 0o600 });
console.log(JSON.stringify({ report: output, setupReady: report.setupReady, publicContractsReachable: report.publicContractsReachable, productionAccepted: false, missingFieldNames: report.missing, gates: report.gates }));
if (!report.setupReady || (mode === 'discover' && !report.publicContractsReachable)) process.exitCode = 2;
