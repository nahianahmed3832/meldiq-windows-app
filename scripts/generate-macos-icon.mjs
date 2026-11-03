import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const source = await fs.readFile('packages/web/public/meldling-512.png');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
if (process.argv.includes('--check')) {
  const metadata = JSON.parse(await fs.readFile('desktop/resources/macos-icon-source.json', 'utf8'));
  const icon = await fs.readFile('desktop/resources/icon.icns');
  if (metadata.sourceSha256 !== digest(source) || metadata.icnsSha256 !== digest(icon) || icon.toString('ascii', 0, 4) !== 'icns' || icon.readUInt32BE(4) !== icon.length) throw new Error('macOS brand icon is stale or malformed');
  console.log('Canonical macOS application icon verified.');
} else {
  if (process.platform !== 'darwin') throw new Error('Regenerate macOS icons on macOS with iconutil.');
  const { default: sharp } = await import('sharp');
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'meldiq-icon-'));
  const iconset = path.join(directory, 'Meldiq.iconset'); await fs.mkdir(iconset);
  try {
    for (const points of [16, 32, 128, 256, 512]) for (const scale of [1, 2])
      await sharp(source).resize(points * scale, points * scale).png().toFile(path.join(iconset, `icon_${points}x${points}${scale === 2 ? '@2x' : ''}.png`));
    execFileSync('iconutil', ['-c', 'icns', iconset, '-o', path.resolve('desktop/resources/icon.icns')]);
    const icon = await fs.readFile('desktop/resources/icon.icns');
    await fs.writeFile('desktop/resources/macos-icon-source.json', JSON.stringify({ canonicalSource: 'packages/web/public/meldling-512.png', sourceSha256: digest(source), icnsSha256: digest(icon) }, null, 2) + '\n');
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
}
