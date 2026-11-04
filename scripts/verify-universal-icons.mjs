import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
const base=path.resolve('packages/web/shared/icons');
const manifest=JSON.parse(await fs.readFile(path.join(base,'manifest.json'),'utf8'));
for(const [file,hash] of Object.entries(manifest)){
 const actual=createHash('sha256').update(await fs.readFile(path.resolve(base,file))).digest('hex');
 if(actual!==hash)throw Error('Universal icon source drift: '+file);
}
const catalogue=JSON.parse(await fs.readFile(path.join(base,'catalogue.json'),'utf8'));
if(catalogue.icons.length!==33)throw Error('Review changed catalogue size');
if(await fs.readFile('packages/web/public/icon-licenses.txt','utf8')!==await fs.readFile(path.join(base,'LICENSE-lucide.txt'),'utf8'))throw Error('Missing bundled icon notices');
console.log(`${catalogue.icons.length} semantic icon sources and renderer hashes verified.`);
