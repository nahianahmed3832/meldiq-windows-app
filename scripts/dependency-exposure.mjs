import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
const { listPackage, extractFile } = createRequire(import.meta.url)('@electron/asar');
const auditFile = process.argv[2];
const filename = process.argv[3] ?? 'release/win-unpacked/resources/app.asar';
if (!auditFile) throw new Error('Pass the fresh npm audit JSON file');
const audit = JSON.parse(fs.readFileSync(auditFile, 'utf8'));
const entries = listPackage(filename).map(p => p.replaceAll('\\', '/'));
const packages = entries.filter(p => p.endsWith('/package.json') && p.includes('/node_modules/')).map(p => {
  const pkg = JSON.parse(extractFile(filename, p.slice(1)).toString());
  return { name: pkg.name, version: pkg.version };
}).filter(p => p.name);
const findings = Object.values(audit.vulnerabilities ?? {}).map(v => ({ name: v.name, severity: v.severity, installedNodes: v.nodes, packagedNodeVersions: packages.filter(p => p.name === v.name).map(p => p.version), assessment: packages.some(p => p.name === v.name) ? 'Packaged Node dependency: requires advisory range review' : 'Not present as a Node package in this ASAR; bundled renderer exposure must also be reviewed', advisories: v.via.filter(a => typeof a !== 'string').map(a => ({ title: a.title, url: a.url, range: a.range })) }));
const report = { checkedAt: new Date().toISOString(), artifact: path.relative(process.cwd(), filename), sha256: crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex'), auditTotals: audit.metadata.vulnerabilities, packagedNodePackages: packages, findings, limits: 'ASAR package inventory is not a blanket advisory waiver. Vite bundles renderer dependencies; review source imports and emitted chunks separately. Electron/Chromium advisories require their own review.' };
fs.mkdirSync('test-results', { recursive: true });
fs.writeFileSync('test-results/dependency-exposure.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ packagedNodePackages: packages.length, findings: findings.length, findingsPresentAsNodePackages: findings.filter(f => f.packagedNodeVersions.length).map(f => f.name), productionSecurityAccepted: false }));
