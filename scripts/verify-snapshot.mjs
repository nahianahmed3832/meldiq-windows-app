import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
const manifest = JSON.parse(await fs.readFile('docs/desktop/WEB_SOURCE_SNAPSHOT.json', 'utf8'));
const changes = JSON.parse(await fs.readFile('docs/desktop/DESKTOP_ADAPTATIONS.json', 'utf8'));
let changed = 0;
for (const [name, hash] of Object.entries(manifest.files)) {
  const actual = createHash('sha256').update(await fs.readFile(`packages/web/${name}`)).digest('hex');
  if (actual !== hash) { if (!Object.hasOwn(changes, name)) throw new Error(`Undocumented upstream source change: ${name}`); changed++; }
}
console.log(`${Object.keys(manifest.files).length} upstream files checked; ${changed} documented desktop adaptations.`);
