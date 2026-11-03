import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const files = JSON.parse(await fs.readFile('dist/renderer/asset-manifest.json', 'utf8'));
assert(files.includes('index.html'));
assert(!files.some(n => /(?:\.map$|^sw\.js$|\.env|^social-auth-callback)/.test(n)));
const html = await fs.readFile('dist/renderer/index.html', 'utf8');
assert(!/<script[^>]+src=["']https?:/.test(html), 'Application scripts must be packaged locally');
const main = await fs.readFile('dist/main/main.cjs', 'utf8');
assert(main.includes('contextIsolation: true') && main.includes('nodeIntegration: false') && main.includes('sandbox: true'));
assert(!main.includes('webSecurity: false'));
const build = JSON.parse(await fs.readFile('dist/build-info.json', 'utf8'));
if (!build.updateLab) assert(!main.includes('MELDIQ_UPDATE_LAB_CONTROL') && !main.includes('meldiq-update-qualification'), 'Updater qualification hooks must be absent from public binaries');
for (const filename of ['dist/main/main.cjs', 'dist/main/preload.cjs', 'dist/main/payment-preload.cjs', ...files.filter(n => /\.(js|html|json)$/.test(n)).map(n => 'dist/renderer/' + n)]) {
  const text = await fs.readFile(filename, 'utf8');
  assert(!text.includes('MELDIQ_ACCEPTANCE_') && !text.includes('desktop-acceptance.env'), 'Acceptance configuration leaked into packaged code: ' + filename);
}
const config = JSON.parse(await fs.readFile('dist/runtime-config.json', 'utf8'));
assert.equal(config.apiOrigin, 'https://web.meldiq.app');
console.log(`Package checks passed: ${files.length} local renderer assets, no service worker shell or source maps.`);
