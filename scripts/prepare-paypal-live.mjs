import fs from 'node:fs/promises';
import { execFileSync, spawnSync } from 'node:child_process';
const prepare = process.argv.includes('--prepare');
if (prepare && execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()) throw new Error('Commit the reviewed merchant preparation code first');
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const code = `import sys,json,pathlib,subprocess,fcntl,os
os.umask(0o077)
p=json.load(sys.stdin)
locks=[]
for f in ['/run/lock/meldiq-production-release.lock','/opt/griip-internal-messaging/.deploy.lock']:
 h=open(f,'a+');fcntl.flock(h,fcntl.LOCK_EX|fcntl.LOCK_NB);locks.append(h)
i=json.loads(subprocess.check_output(['docker','inspect','griip-internal-messaging-api-1']))[0]
assert i['Image']=='sha256:9bb580a8be7a5f2823cd0b9a1ad95bed65291389321658d29124feebe321ba5c','Review the newer production runtime first'
assert i['State']['Health']['Status']=='healthy'
receipt=pathlib.Path('/opt/meldiq-desktop/history/paypal-plus-499-monthly-prepared.json')
args=['docker','exec','-i','griip-internal-messaging-api-1','node','--input-type=module','-']
if p['prepare']:
 args+=['--prepare']
 if receipt.exists():args+=['--existing-plan',json.loads(receipt.read_text())['preparedPlan']['id']]
r=subprocess.run(args,input=p['script'],capture_output=True,text=True,timeout=120)
assert r.returncode==0,r.stderr
result=json.loads(r.stdout)
result['sourceCommit']=p['sourceCommit']
result['apiImage']=i['Image']
if p['prepare']:
 assert result['legacyPricingPreserved'] and not result['checkoutCreated'] and not result['publicSalesEnabled']
 receipt.parent.mkdir(exist_ok=True)
 receipt.write_text(json.dumps(result,indent=2)+'\\n')
print(json.dumps(result))`;
const quoted = "'" + code.replaceAll("'", "'\\''") + "'";
const result = spawnSync('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', 'root@72.60.107.88', 'python3 -c ' + quoted], { input: JSON.stringify({ prepare, sourceCommit, script: await fs.readFile('scripts/paypal-live-readiness.mjs', 'utf8') }), encoding: 'utf8', timeout: 150_000, maxBuffer: 1_048_576 });
if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr || 'PayPal readiness operation failed');
const report = JSON.parse(result.stdout);
await fs.mkdir('test-results', { recursive: true });
await fs.writeFile('test-results/paypal-live-readiness.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
