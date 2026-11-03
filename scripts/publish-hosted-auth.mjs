import fs from 'node:fs/promises';
import { execFileSync, spawnSync } from 'node:child_process';
if (execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()) throw new Error('Commit the reviewed callback sources before deployment');
const payload = JSON.parse(await fs.readFile('release/desktop-browser-handoff/payload.json', 'utf8'));
if (payload.sourceCommit !== execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()) throw new Error('Prepare callback payload from this exact commit');
const quote = code => "'" + code.replaceAll("'", "'\\''") + "'";
const remote = (code, input) => {
  const r = spawnSync('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', 'root@72.60.107.88', 'python3 -c ' + quote(code)], { input, encoding: 'utf8', timeout: 120_000, maxBuffer: 1_048_576 });
  if (r.error || r.status !== 0) throw new Error(r.error?.message || r.stderr || 'Hosted callback operation failed');
  return JSON.parse(r.stdout);
};
const expected = remote(`import pathlib,hashlib,json,subprocess
p=pathlib.Path('/etc/nginx/sites-available/meldiq-web.conf')
i=json.loads(subprocess.check_output(['docker','inspect','griip-internal-messaging-api-1']))[0]
print(json.dumps({'expectedWebRelease':str(pathlib.Path('/opt/meldiq-web/current').resolve()),'expectedNginxSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'expectedApiImageId':i['Image']}))`);
console.log(JSON.stringify({ operation: process.argv.includes('--publish') ? 'publish hosted callbacks' : 'read-only deployment preflight', ...expected, identity: payload.identity }));
if (process.argv.includes('--publish')) {
  const result = remote(await fs.readFile('scripts/deploy-hosted-auth.py', 'utf8'), JSON.stringify({ ...payload, ...expected }));
  await fs.mkdir('test-results', { recursive: true });
  await fs.writeFile('test-results/hosted-auth-deployment.json', JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
}
