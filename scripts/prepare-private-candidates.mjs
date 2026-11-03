import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const run = (file, args, env) => execFileSync(file, args, { env, stdio: 'inherit' });
const original = JSON.parse(await fs.readFile('package.json', 'utf8'));
const plans = [{ role: 'production', version: original.version }, { role: 'lab-old', version: original.version + '-canary.1' }, { role: 'lab-new', version: original.version + '-canary.2' }];
const result = { runId: process.env.GITHUB_RUN_ID, sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), keyId: JSON.parse(await fs.readFile('config/update-key.json', 'utf8')).keyId, artifacts: [] };
await fs.mkdir('private-candidates', { recursive: true });
try {
  for (const plan of plans) {
    await fs.writeFile('package.json', JSON.stringify({ ...original, version: plan.version }, null, 2) + '\n');
    await fs.rm('release', { recursive: true, force: true });
    const lab = plan.role !== 'production';
    const env = { ...process.env, BUILD_DISTRIBUTION: 'private-direct', BUILD_CHANNEL: lab ? 'canary' : 'stable', MELDIQ_PRIVATE_UPDATE_RELEASE: '1', MELDIQ_UPDATE_LAB: lab ? '1' : '', MELDIQ_UPDATE_LAB_ROOT: 'https://meldiq.app/desktop-updates/qualification/' + process.env.GITHUB_RUN_ID };
    run(process.execPath, ['scripts/build.mjs'], env);
    if (!lab) run(process.execPath, ['scripts/verify-package.mjs'], env);
    run(process.execPath, ['node_modules/electron-builder/cli.js', '--config', 'desktop/builder.private.cjs', '--win', 'nsis', '--x64', '--publish', 'never'], env);
    const files = (await fs.readdir('release')).filter(p => p.endsWith('.exe'));
    if (files.length !== 1) throw new Error('Exactly one candidate installer is required');
    const filename = files[0], bytes = await fs.readFile(path.join('release', filename));
    const info = { role: plan.role, version: plan.version, filename, size: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), sha512: createHash('sha512').update(bytes).digest('base64'), build: JSON.parse(await fs.readFile('dist/build-info.json', 'utf8')) };
    result.artifacts.push(info);
    await fs.copyFile(path.join('release', filename), path.join('private-candidates', filename));
  }
} finally { await fs.writeFile('package.json', JSON.stringify(original, null, 2) + '\n'); }
await fs.writeFile('private-candidates/private-candidates.json', JSON.stringify(result, null, 2) + '\n');
console.log('MELDIQ_PRIVATE_CANDIDATES=' + JSON.stringify(result));
