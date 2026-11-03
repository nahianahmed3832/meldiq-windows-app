import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const base = 'https://meldiq.app', temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'meldiq-live-release-'));
try {
  const option = process.argv.indexOf('--candidates');
  const candidateFile = option < 0 ? 'docs/desktop/evidence/private-update-0.2.0/candidates.json' : process.argv[option + 1];
  if (!candidateFile) throw new Error('Pass the reviewed candidate provenance JSON path');
  const key = JSON.parse(await fs.readFile('config/update-key.json', 'utf8'));
  const candidate = JSON.parse(await fs.readFile(candidateFile, 'utf8'));
  const artifact = candidate.artifacts.find(a => a.role === 'production');
  await build({ entryPoints: ['desktop/main/signed-release.ts'], outfile: path.join(temporary, 'verifier.cjs'), bundle: true, platform: 'node', format: 'cjs' });
  const { SignedReleaseTrust } = createRequire(import.meta.url)(path.join(temporary, 'verifier.cjs'));
  const trust = new SignedReleaseTrust({ keys: [key], appId: 'app.meldiq.desktop', checkpointFile: path.join(temporary, 'trust.json') }, base + '/desktop-updates', 'stable');
  const release = await trust.fetchRelease();
  assert.equal(release.version, artifact.version);
  for (const field of ['sha256', 'sha512', 'filename', 'size']) assert.equal(release.file[field], artifact[field]);
  assert.equal(release.file.url, artifact.downloadUrl);
  const request = async (url, method = 'GET') => {
    const response = await fetch(url, { method, redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(180000) });
    assert.equal(response.status, 200, 'Live release endpoint must return 200');
    return response;
  };
  const feed = await request(base + '/desktop-updates/windows/stable/release.json', 'HEAD');
  assert.match(feed.headers.get('content-type') ?? '', /application\/json/);
  assert.match(feed.headers.get('cache-control') ?? '', /no-store/);
  const page = await (await request(base + '/download')).text();
  assert(page.includes('href="' + new URL(release.file.url).pathname + '"'), 'Live page must link the exact authenticated installer');
  assert(page.replace(/<!--[\s\S]*?-->/g, '').includes('Version ' + release.version));
  const head = await request(release.file.url, 'HEAD');
  assert.equal(Number(head.headers.get('content-length')), release.file.size);
  assert.match(head.headers.get('content-type') ?? '', /application\/octet-stream/);
  assert.match(head.headers.get('content-disposition') ?? '', /attachment/);
  assert.match(head.headers.get('cache-control') ?? '', /immutable/);
  const checksum = await (await request(new URL('checksums.sha256', release.file.url))).text();
  assert.equal(checksum.trim(), release.file.sha256 + '  ' + release.file.filename);
  const response = await request(release.file.url), file = path.join(temporary, release.file.filename);
  assert(response.body);
  let received = 0;
  const bound = new Transform({ transform(chunk, encoding, callback) {
    received += chunk.length;
    callback(received > release.file.size ? new Error('Download exceeds signed byte length') : null, chunk);
  } });
  await pipeline(Readable.fromWeb(response.body), bound, createWriteStream(file, { flags: 'wx', mode: 0o600 }));
  assert.equal(received, release.file.size);
  assert.equal(await trust.verifyFile(file), null, 'Full public download must match both signed digests');
  const report = { verifiedAt: new Date().toISOString(), status: 'passed', page: base + '/download', feed: base + '/desktop-updates/windows/stable/release.json', download: release.file.url, version: release.version, bytes: received, sha256: release.file.sha256, sha512: release.file.sha512, sourceCommit: candidate.sourceCommit, keyId: key.keyId, sequence: release.sequence, expiresAt: release.expiresAt, signedFeedVerified: true, fullPublicDownloadVerified: true, immutableArtifactHeaders: true, uncachedMetadataHeaders: true, exactWebsiteLink: true };
  await fs.mkdir('test-results', { recursive: true });
  await fs.writeFile('test-results/private-live-verification.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
} finally { await fs.rm(temporary, { recursive: true, force: true }); }
