// Owner explicitly reauthorized the existing pinned release-key distribution on 2026-11-04.
// This authenticates updates; it does not claim Windows publisher trust or complete feature acceptance.
if (!process.argv.includes('--owner-authorized-private-release')) throw new Error('Explicit owner-authorized private release selection required');
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
const args = process.argv.slice(2), index = args.indexOf('--qualification-run'), qualificationRun = index < 0 ? '' : args[index + 1];
if (!/^[1-9]\d+$/.test(qualificationRun ?? '')) throw new Error('Pass the successful native --qualification-run');
const gh = argv => execFileSync('gh', argv, { encoding: 'utf8', maxBuffer: 20 * 1024 ** 2 });
const run = JSON.parse(gh(['run', 'view', qualificationRun, '--json', 'conclusion']));
if (run.conclusion !== 'success') throw new Error('Native private-upgrade qualification has not passed');
const line = gh(['run', 'view', qualificationRun, '--log']).split('\n').find(l => l.includes('MELDIQ_PRIVATE_QUALIFIED={'));
if (!line) throw new Error('Missing complete native update qualification evidence');
const qualified = JSON.parse(line.slice(line.indexOf('MELDIQ_PRIVATE_QUALIFIED=') + 'MELDIQ_PRIVATE_QUALIFIED='.length));
const stage = JSON.parse(await fs.readFile('test-results/private-candidate-staging.json', 'utf8'));
const staging = JSON.parse(await fs.readFile(path.join(stage.working, 'staging.json'), 'utf8'));
const key = JSON.parse(await fs.readFile('config/update-key.json', 'utf8'));
if (qualified.status !== 'passed' || qualified.candidateRun !== staging.runId || qualified.sourceCommit !== staging.sourceCommit || qualified.keyId !== key.keyId) throw new Error('Native qualification/source/signing identity mismatch');
for (const scenario of ['bad-signature', 'bad-hash', 'upgrade']) {
  const result = qualified.tests.find(t => t.scenario === scenario);
  if (!result || result.status !== 'passed') throw new Error('Missing required native update scenario');
  if (scenario === 'upgrade') for (const check of ['actualInstallerUpgrade', 'automaticCheckAndDownload', 'automaticInstallOnSafeExit', 'busyGuardPassed', 'accountRetained', 'messageRetained', 'sealedSessionRetained', 'localStorageRetained']) if (result[check] !== true) throw new Error('Missing installed upgrade evidence: ' + check);
}
if (execFileSync('git', ['diff', staging.sourceCommit, 'HEAD', '--', 'desktop', 'packages/web', 'config', 'package.json', 'package-lock.json', 'scripts/build.mjs', 'scripts/prepare-private-candidates.mjs'], { encoding: 'utf8' }).trim()) throw new Error('Runtime changed after qualification');
const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'meldiq-publish-verifier-'));
await build({ entryPoints: ['desktop/main/signed-release.ts'], outfile: path.join(directory, 'verify.cjs'), bundle: true, platform: 'node', format: 'cjs' });
const { verifyReleaseEnvelope } = createRequire(import.meta.url)(path.join(directory, 'verify.cjs'));
const signed = staging.files.find(f => f.scenario === 'production'), envelope = await fs.readFile(signed.envelopeFile, 'utf8');
const authenticated = verifyReleaseEnvelope(envelope, { keys: [key], appId: 'app.meldiq.desktop', channel: 'stable', baseUrl: 'https://meldiq.app/desktop-updates' }).release;
const artifact = staging.artifacts.find(a => a.role === 'production');
if (qualified.publishedBaselineUpgrade?.baselineVersion !== '0.2.1' || qualified.publishedBaselineUpgrade?.candidateSha256 !== artifact.sha256 || qualified.publishedBaselineUpgrade?.passed?.length < 12) throw new Error('The exact public candidate has not passed the published 0.2.1 upgrade checks');
if (qualified.currentProductionUpgrade?.baselineVersion !== '0.3.2' || qualified.currentProductionUpgrade?.candidateSha256 !== artifact.sha256 || qualified.currentProductionUpgrade?.passed?.length < 12) throw new Error('The current public 0.3.2 installer upgrade has not passed');
if (artifact.build.updateLab !== false || artifact.version !== authenticated.version || artifact.sha256 !== authenticated.file.sha256 || artifact.sha512 !== authenticated.file.sha512 || artifact.filename !== authenticated.file.filename || artifact.downloadUrl !== authenticated.file.url || artifact.size !== authenticated.file.size) throw new Error('Public installer and signed release do not match');
const details = { product: 'Meldiq Desktop', version: artifact.version, platform: 'Windows x64', sourceCommit: staging.sourceCommit, installer: artifact.filename, bytes: artifact.size, sha256: artifact.sha256, windowsPublisherSigned: false, automaticUpdates: true, updateAuthentication: 'Pinned Ed25519 release-key signatures and artifact digests', releaseKeyId: key.keyId, candidateRun: staging.runId, qualificationRun, productionFeatureAcceptance: false };
const code = await fs.readFile('scripts/remote-stage-desktop.py', 'utf8');
const result = spawnSync('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', 'root@72.60.107.88', 'python3 -c ' + "'" + code.replaceAll("'", "'\\''") + "'"], { input: JSON.stringify({ mode: 'publish', run: staging.runId, qualificationRun, artifact, envelope, details, expectedPreviousVersion: qualified.currentProductionUpgrade.baselineVersion, expectedPreviousSha256: qualified.currentProductionUpgrade.baselineSha256 }), encoding: 'utf8', maxBuffer: 1048576, timeout: 60000 });
if (result.status !== 0) {
  const lines = [...(result.stderr ?? '').matchAll(/File "<string>", line (\d+)/g)].map(match => match[1]);
  const kind = (result.stderr ?? '').match(/^(AssertionError|FileNotFoundError|KeyError|PermissionError|BlockingIOError|ValueError|OSError|TypeError|NameError):?/m)?.[1] ?? result.error?.code ?? 'remote-error';
  throw new Error(`Private release publication failed (${kind}, exit ${result.status}, helper lines ${lines.join(',')}); credential-bearing diagnostics withheld`);
}
const receipt = JSON.parse(result.stdout);
await fs.writeFile('test-results/private-release-publication.json', JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify(receipt));
