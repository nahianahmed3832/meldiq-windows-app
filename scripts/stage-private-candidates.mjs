import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
const args = process.argv.slice(2), index = args.indexOf('--run'), runId = index < 0 ? '' : args[index + 1];
if (!/^[1-9]\d+$/.test(runId ?? '')) throw new Error('Pass a numeric candidate --run');
const repo = 'nahianahmed3832/meldiq-windows-app';
const gh = argv => execFileSync('gh', argv, { encoding: 'utf8', maxBuffer: 20 * 1024 ** 2 });
const run = JSON.parse(gh(['run', 'view', runId, '--json', 'headSha,conclusion']));
if (run.conclusion !== 'success') throw new Error('Candidate preparation has not passed');
const line = gh(['run', 'view', runId, '--log']).split('\n').find(l => l.includes('MELDIQ_PRIVATE_CANDIDATES={'));
if (!line) throw new Error('Missing candidate build provenance');
const input = JSON.parse(line.slice(line.indexOf('MELDIQ_PRIVATE_CANDIDATES=') + 'MELDIQ_PRIVATE_CANDIDATES='.length));
const key = JSON.parse(await fs.readFile('config/update-key.json', 'utf8'));
if (input.runId !== runId || input.sourceCommit !== run.headSha || input.keyId !== key.keyId) throw new Error('Candidate signing identity/source mismatch');
if (execFileSync('git', ['diff', input.sourceCommit, 'HEAD', '--', 'desktop', 'packages/web', 'config', 'package.json', 'package-lock.json', 'scripts/build.mjs', 'scripts/prepare-private-candidates.mjs'], { encoding: 'utf8' }).trim()) throw new Error('Runtime source changed after preparation; rebuild candidates');
const draft = JSON.parse(gh(['api', 'repos/' + repo + '/releases'])).find(r => r.tag_name === 'windows-private-candidate-' + runId && r.draft);
if (!draft) throw new Error('Missing isolated candidate draft');
const working = await fs.mkdtemp(path.join(os.tmpdir(), 'meldiq-release-' + runId + '-'));
await build({ entryPoints: ['desktop/main/signed-release.ts'], outfile: path.join(working, 'verifier.cjs'), platform: 'node', bundle: true, format: 'cjs' });
const require = createRequire(import.meta.url);
const { verifyReleaseEnvelope } = require(path.join(working, 'verifier.cjs'));
const remoteCode = await fs.readFile('scripts/remote-stage-desktop.py', 'utf8');
const ssh = data => {
  const result = spawnSync('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', 'root@72.60.107.88', 'python3 -c ' + "'" + remoteCode.replaceAll("'", "'\\''") + "'"], { input: JSON.stringify(data), encoding: 'utf8', maxBuffer: 1048576, timeout: 600000 });
  if (result.status !== 0) throw new Error('Remote desktop staging failed; credential-bearing diagnostics withheld');
  console.log(result.stdout.trim());
};
const token = gh(['auth', 'token']).trim();
for (const item of input.artifacts) {
  if (!['production', 'lab-old', 'lab-new'].includes(item.role) || !/^Meldiq-[A-Za-z0-9._-]+\.exe$/.test(item.filename) || !/^[a-f0-9]{64}$/.test(item.sha256) || item.build.commit !== input.sourceCommit) throw new Error('Invalid artifact provenance');
  const asset = draft.assets.find(a => a.name === item.filename && a.state === 'uploaded');
  if (!asset) throw new Error('Candidate asset not uploaded');
  let response;
  for (let attempt = 0; attempt < 3; attempt++) {
    try { response = await fetch(asset.url, { redirect: 'manual', signal: AbortSignal.timeout(30000), headers: { authorization: 'Bearer ' + token, accept: 'application/octet-stream', 'x-github-api-version': '2022-11-28' } }); break; }
    catch { if (attempt === 2) throw new Error('Candidate download authorization is temporarily unavailable'); }
  }
  const location = response.headers.get('location');
  if (response.status !== 302 || !location?.startsWith('https://')) throw new Error('Cannot obtain an authorized candidate download');
  const relative = item.version + '/' + item.sha256.slice(0, 16) + '/' + item.filename;
  item.downloadUrl = 'https://meldiq.app/downloads/windows/' + relative;
  item.serverPath = item.role === 'production' ? '/opt/meldiq-desktop/candidates/' + runId + '/' + item.filename : '/opt/meldiq-desktop/downloads/windows/' + relative;
  ssh({ mode: 'download', url: location, destination: item.serverPath, size: item.size, sha256: item.sha256 });
}
const newer = input.artifacts.find(a => a.role === 'lab-new'), production = input.artifacts.find(a => a.role === 'production');
const files = [];
for (const scenario of ['upgrade', 'bad-hash', 'bad-signature', 'production']) {
  const item = scenario === 'production' ? production : newer, channel = scenario === 'production' ? 'stable' : 'canary';
  const payload = { schema: 1, appId: scenario === 'production' ? 'app.meldiq.desktop' : 'app.meldiq.desktop.update-lab', platform: 'win32', arch: 'x64', channel, version: item.version, sequence: Date.now(), releasedAt: new Date(Date.now() - 1000).toISOString(), expiresAt: new Date(Date.now() + 90 * 86400000).toISOString(), file: { url: item.downloadUrl, filename: item.filename, size: item.size, sha256: item.sha256, sha512: item.sha512 } };
  if (scenario === 'bad-hash') payload.file.url = 'https://meldiq.app/downloads/windows/' + item.version + '/qualification-' + runId + '-corrupt/' + item.filename;
  const payloadFile = path.join(working, scenario + '.payload.json'), envelopeFile = path.join(working, scenario + '.json');
  await fs.writeFile(payloadFile, JSON.stringify(payload) + '\n');
  execFileSync(require('electron'), ['scripts/update-key.cjs', 'sign', payloadFile, envelopeFile], { stdio: ['ignore', 'pipe', 'pipe'], timeout: 30000 });
  const raw = await fs.readFile(envelopeFile, 'utf8');
  verifyReleaseEnvelope(raw, { keys: [key], channel, appId: payload.appId, baseUrl: 'https://meldiq.app/desktop-updates' });
  if (scenario === 'bad-signature') {
    const envelope = JSON.parse(raw), signature = Buffer.from(envelope.signatures[0].signature, 'base64');
    signature[0] ^= 1; envelope.signatures[0].signature = signature.toString('base64');
    await fs.writeFile(envelopeFile, JSON.stringify(envelope) + '\n');
  }
  files.push({ scenario, payload, envelopeFile });
}
ssh({ mode: 'fixtures', run: runId, files: await Promise.all(files.filter(f => f.scenario !== 'production').map(async f => ({ scenario: f.scenario, envelope: await fs.readFile(f.envelopeFile, 'utf8') }))), corruptPath: '/opt/meldiq-desktop/downloads/windows/' + newer.version + '/qualification-' + runId + '-corrupt/' + newer.filename });
await fs.writeFile(path.join(working, 'staging.json'), JSON.stringify({ ...input, working, files }, null, 2) + '\n');
await fs.mkdir('test-results', { recursive: true });
await fs.writeFile('test-results/private-candidate-staging.json', JSON.stringify({ runId, sourceCommit: input.sourceCommit, keyId: key.keyId, working, stableFeedPublished: false }, null, 2) + '\n');
console.log(JSON.stringify({ runId, working, qualificationReady: true, stableFeedPublished: false }));
