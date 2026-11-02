import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
const files = (await fs.readdir('release')).filter(n => /\.(exe|blockmap|yml)$/.test(n));
if (!files.some(n => n.endsWith('.exe'))) throw new Error('No Windows installer was produced');
const entries = [];
for (const name of files) { const bytes = await fs.readFile(`release/${name}`); entries.push({ name, size: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), sha512: createHash('sha512').update(bytes).digest('base64') }); }
await fs.writeFile('release/checksums.sha256', entries.map(e => `${e.sha256}  ${e.name}`).join('\n') + '\n');
await fs.writeFile('release/build-manifest.json', JSON.stringify({ build: JSON.parse(await fs.readFile('dist/build-info.json', 'utf8')), artifacts: entries }, null, 2));
console.log('Release manifest and checksums generated.');
