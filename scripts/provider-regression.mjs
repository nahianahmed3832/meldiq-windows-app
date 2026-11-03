import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const backend = process.env.ORBIT_SERVER_DIR;
if (!backend || !path.isAbsolute(backend)) throw new Error('Point ORBIT_SERVER_DIR at the existing backend source checkout. Tests use local stand-ins only.');
const files = ['billing_paypal.test.ts', 'billing_paypal_live.test.ts', 'paypal_capabilities.test.ts', 'paypal_sandbox_gift_lifecycle.test.ts', 'discord_import.test.ts', 'discord_mapping.test.ts', 'social_auth.test.ts'];
for (const file of files) await fs.access(path.join(backend, 'test', file));
await fs.mkdir('test-results', { recursive: true });
const output = path.resolve('test-results/provider-regression.json');
const sourceCommit = execFileSync('git', ['-C', backend, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
await fs.writeFile('test-results/provider-regression-scope.json', JSON.stringify({ sourceCommit, scope: 'existing backend source with fake PayPal/Discord/provider endpoints and disposable data; not deployed production/provider acceptance', files }, null, 2));
// Never inherit production credentials, database URLs, mail, AWS or provider configuration.
execFileSync(process.execPath, [path.join(backend, 'node_modules/vitest/vitest.mjs'), 'run', ...files.map(file => 'test/' + file), '--reporter=default', '--reporter=json', '--outputFile=' + output], {
  cwd: backend,
  env: { PATH: process.env.PATH, HOME: process.env.HOME, TMPDIR: process.env.TMPDIR, APP_ENV: 'test', NODE_ENV: 'test' },
  stdio: 'inherit',
});
