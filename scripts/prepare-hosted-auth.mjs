import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const entries = {
  'desktop-bridge.html': 'packages/web/public/desktop-bridge.html',
  'desktop-bridge.js': 'packages/web/public/desktop-bridge.js',
  'desktop-bridge.json': 'packages/web/public/desktop-bridge.json',
  'social-auth-callback.js': 'packages/web/public/social-auth-callback.js',
  'desktop-discord-callback.html': 'desktop/hosted/discord-callback.html',
  'desktop-discord-return.js': 'desktop/hosted/desktop-discord-return.js',
};
const files = {};
for (const [name, source] of Object.entries(entries)) {
  const bytes = await fs.readFile(source);
  files[name] = { source, content: bytes.toString('base64'), sha256: createHash('sha256').update(bytes).digest('hex') };
}
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const identity = createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.entries(files).map(([n, f]) => [n, f.sha256])))).digest('hex');
await fs.mkdir('release/desktop-browser-handoff', { recursive: true });
await fs.writeFile('release/desktop-browser-handoff/payload.json', JSON.stringify({ sourceCommit, identity, files }, null, 2) + '\n');
console.log(JSON.stringify({ sourceCommit, identity, files: Object.keys(files), output: 'release/desktop-browser-handoff/payload.json' }));
