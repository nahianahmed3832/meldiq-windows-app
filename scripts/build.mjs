import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { build as viteBuild } from 'vite';
import { build as esbuild } from 'esbuild';
const root = path.resolve(import.meta.dirname, '..');
execFileSync(process.execPath, ['scripts/validate-builder.mjs'], { cwd: root, stdio: 'inherit' });
const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
const channel = process.env.BUILD_CHANNEL ?? 'stable';
const distribution = process.env.BUILD_DISTRIBUTION ?? 'development';
if (!['stable', 'beta', 'canary'].includes(channel) || !['development', 'direct', 'store'].includes(distribution)) throw new Error('Invalid build channel/distribution');
if (distribution === 'direct') execFileSync(process.execPath, ['scripts/release-preflight.mjs'], { cwd: root, stdio: 'inherit' });
await fs.rm(path.join(root, 'dist'), { recursive: true, force: true });
await fs.mkdir(path.join(root, 'dist/main'), { recursive: true });
let commit = 'uncommitted';
try { commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(); } catch { /* initial checkout */ }
const timestamp = process.env.SOURCE_DATE_EPOCH ? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString() : new Date().toISOString();
const info = { version: pkg.version, commit, timestamp, channel, distribution };
await fs.writeFile(path.join(root, 'dist/build-info.json'), JSON.stringify(info, null, 2));
const config = JSON.parse(await fs.readFile(path.join(root, 'config/desktop.json'), 'utf8'));
for (const origin of config.connectOrigins) {
  const url = new URL(origin);
  if (!['https:', 'wss:'].includes(url.protocol) || url.origin !== origin || /[\s;'"<>]/.test(origin)) throw new Error('Invalid approved connection origin');
}
config.publisherName = distribution === 'direct' ? process.env.MELDIQ_SIGNING_PUBLISHER : null;
config.releaseApproved = distribution === 'direct' && process.env.MELDIQ_RELEASE_APPROVED === '1';
await fs.writeFile(path.join(root, 'dist/runtime-config.json'), JSON.stringify(config, null, 2));
await Promise.all([
  esbuild({ entryPoints: [path.join(root, 'desktop/main/main.ts')], outfile: path.join(root, 'dist/main/main.cjs'), platform: 'node', target: 'node22', format: 'cjs', bundle: true, packages: 'external', sourcemap: false }),
  esbuild({ entryPoints: [path.join(root, 'desktop/preload/index.ts')], outfile: path.join(root, 'dist/main/preload.cjs'), platform: 'node', target: 'node22', format: 'cjs', bundle: true, external: ['electron'], sourcemap: false }),
  esbuild({ entryPoints: [path.join(root, 'desktop/preload/payment.ts')], outfile: path.join(root, 'dist/main/payment-preload.cjs'), platform: 'node', target: 'node22', format: 'cjs', bundle: true, external: ['electron'], sourcemap: false }),
]);
await viteBuild({
  configFile: false, root: path.join(root, 'desktop/renderer'),
  publicDir: path.join(root, 'packages/web/public'),
  resolve: { alias: { 'next/router': path.join(root, 'desktop/renderer/next-router.ts') } },
  define: { 'process.env.NODE_ENV': JSON.stringify('production'), 'process.env.MELDIQ_APP_VERSION': JSON.stringify(pkg.version), 'process.env.NEXT_PUBLIC_MELDIQ_TEST_LINKING': JSON.stringify('0') },
  build: { outDir: path.join(root, 'dist/renderer'), emptyOutDir: true, sourcemap: false, target: 'chrome150', chunkSizeWarningLimit: 1500 },
  worker: { format: 'es' },
});
async function allFiles(dir, prefix = '') {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(e => e.isDirectory() ? allFiles(path.join(dir, e.name), prefix + e.name + '/') : prefix + e.name))).flat();
}
const renderer = path.join(root, 'dist/renderer');
// PWA callbacks and manifests are web entry points; none may replace the desktop bundle.
for (const name of ['social-auth-callback.html', 'social-auth-callback.js', 'invite.html', 'invite.js', 'manifest.webmanifest', 'sw.js']) await fs.rm(path.join(renderer, name), { force: true });
await fs.writeFile(path.join(renderer, 'asset-manifest.json'), JSON.stringify((await allFiles(renderer)).sort()));
console.log(`Built Meldiq ${pkg.version}, ${distribution}/${channel}, ${commit.slice(0, 12)}.`);
