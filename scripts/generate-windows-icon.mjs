import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
// Resample the existing approved asset; no new artwork or framework fallback.
const source = await fs.readFile('packages/web/public/meldling-256.png');
const sizes = [16, 20, 24, 32, 40, 48, 64, 128, 256];
const digest = data => createHash('sha256').update(data).digest('hex');
if (process.argv.includes('--check')) {
  const ico = await fs.readFile('desktop/resources/icon.ico');
  const metadata = JSON.parse(await fs.readFile('desktop/resources/icon-source.json', 'utf8'));
  if (metadata.canonicalSha256 !== digest(source) || metadata.icoSha256 !== digest(ico) || !source.equals(await fs.readFile('desktop/resources/icon.png'))) throw new Error('Brand source or ICO changed; run npm run icons:generate');
  if (ico.readUInt16LE(0) !== 0 || ico.readUInt16LE(2) !== 1 || ico.readUInt16LE(4) !== sizes.length) throw new Error('Invalid ICO directory');
  for (const [i, size] of sizes.entries()) {
    const entry = 6 + i * 16, offset = ico.readUInt32LE(entry + 12), length = ico.readUInt32LE(entry + 8);
    if ((ico[entry] || 256) !== size || (ico[entry + 1] || 256) !== size || offset + length > ico.length || ico.readUInt32BE(offset + 16) !== size || ico.readUInt32BE(offset + 20) !== size) throw new Error('Invalid ICO image size');
  }
  console.log('Canonical Windows branding and all nine ICO resolutions verified.');
  process.exit(0);
}
const { default: sharp } = await import('sharp');
const images = await Promise.all(sizes.map(size => sharp(source).resize(size, size).png().toBuffer()));
const directory = Buffer.alloc(6 + sizes.length * 16);
directory.writeUInt16LE(1, 2); directory.writeUInt16LE(sizes.length, 4);
let offset = directory.length;
for (const [i, data] of images.entries()) {
  const entry = 6 + i * 16;
  directory[entry] = sizes[i] % 256; directory[entry + 1] = sizes[i] % 256;
  directory.writeUInt16LE(1, entry + 4); directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(data.length, entry + 8); directory.writeUInt32LE(offset, entry + 12);
  offset += data.length;
}
const ico = Buffer.concat([directory, ...images]);
await fs.writeFile('desktop/resources/icon.ico', ico);
await fs.writeFile('desktop/resources/icon.png', source);
const metadata = { sizes, bytes: ico.length, canonicalSha256: digest(source), icoSha256: digest(ico) };
await fs.writeFile('desktop/resources/icon-source.json', JSON.stringify(metadata, null, 2) + '\n');
console.log(JSON.stringify(metadata));
