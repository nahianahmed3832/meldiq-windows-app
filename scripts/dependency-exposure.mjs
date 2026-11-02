import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { listPackage, extractFile } = createRequire(import.meta.url)('@electron/asar');
const auditFile = process.argv[2];
const filename = process.argv[3] ?? 'release/win-unpacked/resources/app.asar';
if (!auditFile) throw new Error('Pass the fresh npm audit JSON file');
const audit = JSON.parse(fs.readFileSync(auditFile, 'utf8'));
const entries = listPackage(filename).map(p => p.replaceAll('\\', '/'));
const readArchive = relative => extractFile(filename, path.normalize(relative));
const asarBuild = JSON.parse(readArchive('dist/build-info.json').toString());
const packages = entries.filter(p => p.endsWith('/package.json') && p.includes('/node_modules/')).map(p => {
  const pkg = JSON.parse(readArchive(p.slice(1)).toString());
  return { name: pkg.name, version: pkg.version };
}).filter(p => p.name);
const findings = Object.values(audit.vulnerabilities ?? {}).map(v => ({ name: v.name, severity: v.severity, installedNodes: v.nodes, packagedNodeVersions: packages.filter(p => p.name === v.name).map(p => p.version), assessment: packages.some(p => p.name === v.name) ? 'Packaged Node dependency: requires advisory range review' : 'Not present as a Node package in this ASAR; bundled renderer exposure must also be reviewed', advisories: v.via.filter(a => typeof a !== 'string').map(a => ({ title: a.title, url: a.url, range: a.range })) }));
let renderer = null;
if (fs.existsSync('test-results/renderer-module-inventory.json')) {
  const inventory = JSON.parse(fs.readFileSync('test-results/renderer-module-inventory.json', 'utf8'));
  const packageNames = [...new Set(inventory.chunks.flatMap(chunk => chunk.modules.flatMap(m => [...m.id.matchAll(/(?:^|\/)node_modules\/((?:@[^/]+\/)?[^/]+)/g)].slice(-1).map(match => match[1]))))].sort();
  const sameBuild = inventory.build.commit === asarBuild.commit && inventory.build.timestamp === asarBuild.timestamp && inventory.build.version === asarBuild.version;
  if (process.argv.includes('--require-matching-build')) assert(sameBuild, 'Renderer inventory and packaged ASAR must come from the same build');
  renderer = { build: inventory.build, sameBuildAsAsar: sameBuild, chunks: inventory.chunks.length, bundledPackageNames: packageNames, findingsInBundle: findings.filter(f => packageNames.includes(f.name)).map(f => f.name), scope: 'Actual renderer/worker Rollup graph; exact build identity comparison is explicit. Package presence does not establish that a propagated advisory applies to the bundled submodule.' };
}
if (process.argv.includes('--require-matching-build')) assert(renderer, 'Missing actual renderer module graph');
const report = { checkedAt: new Date().toISOString(), artifact: path.relative(process.cwd(), filename), build: asarBuild, sha256: crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex'), auditTotals: audit.metadata.vulnerabilities, packagedNodePackages: packages, renderer, findings, limits: 'ASAR package inventory and renderer graph must be tied to their respective exact builds, not treated as blanket advisory waivers. Build-tool findings remain open. Electron/Chromium advisories require their own review.' };
fs.mkdirSync('test-results', { recursive: true });
fs.writeFileSync('test-results/dependency-exposure.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ packagedNodePackages: packages.length, findings: findings.length, findingsPresentAsNodePackages: findings.filter(f => f.packagedNodeVersions.length).map(f => f.name), findingsInRendererBundle: renderer?.findingsInBundle ?? 'not measured', productionSecurityAccepted: false }));
