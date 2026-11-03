import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import { build } from 'esbuild';
const bundle = await build({ entryPoints: ['packages/web/src/i18n/catalog.ts'], bundle: true, write: false, platform: 'node', format: 'esm' });
const { CATALOGS, ENGLISH, localizationCoverage } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',');
for (const [locale, catalog] of Object.entries(CATALOGS)) for (const [key, value] of Object.entries(catalog)) {
  if (!Object.hasOwn(ENGLISH, key)) throw new Error(`${locale}: unknown key ${key}`);
  if (!value.trim() || placeholders(value) !== placeholders(ENGLISH[key])) throw new Error(`${locale}: empty translation or placeholder mismatch in ${key}`);
}
async function sources(dir) {
  return (await Promise.all((await fs.readdir(dir, { withFileTypes: true })).map(e => e.isDirectory() ? sources(path.join(dir, e.name)) : /\.tsx$/.test(e.name) ? [path.join(dir, e.name)] : []))).flat();
}
const hardcoded = [];
for (const file of [...await sources('packages/web/src/ui'), ...await sources('desktop/renderer')]) {
  const source = ts.createSourceFile(file, await fs.readFile(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const add = (node, text) => { if (/\p{L}/u.test(text)) hardcoded.push({ file: file.replaceAll('\\', '/'), line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1, text: text.trim().replace(/\s+/g, ' ') }); };
  const visit = node => {
    if (ts.isJsxText(node)) add(node, node.text);
    if (ts.isJsxAttribute(node) && ['title', 'placeholder', 'aria-label', 'alt'].includes(node.name.getText(source)) && node.initializer && ts.isStringLiteral(node.initializer)) add(node, node.initializer.text);
    if (ts.isStringLiteral(node) && node.parent && ts.isCallExpression(node.parent) && ['setError', 'setNotice', 'setMessage'].includes(node.parent.expression.getText(source))) add(node, node.text);
    ts.forEachChild(node, visit);
  };
  visit(source);
}
const coverage = localizationCoverage();
const report = { recordedAt: new Date().toISOString(), complete: coverage.every(c => c.missing.length === 0) && hardcoded.length === 0, scope: 'Central keys plus JSX text, accessible attributes, and common error setters. Dynamic/native literals require additional review.', coverage, hardcoded };
await fs.mkdir('test-results', { recursive: true });
await fs.writeFile('test-results/localization.json', JSON.stringify(report, null, 2));
const counts = { missing: Object.fromEntries(coverage.map(c => [c.language, c.missing.length])), hardcoded: hardcoded.length };
if (process.argv.includes('--write-baseline')) {
  await fs.writeFile('docs/desktop/localization-baseline.json', JSON.stringify(counts, null, 2) + '\n');
} else {
  const baseline = JSON.parse(await fs.readFile('docs/desktop/localization-baseline.json', 'utf8'));
  for (const [locale, count] of Object.entries(counts.missing)) if (!(locale in baseline.missing) || count > baseline.missing[locale]) throw new Error(`Localization regressed: ${locale} has ${count} missing keys`);
  if (counts.hardcoded > baseline.hardcoded) throw new Error('Hardcoded UI strings increased; centralize the new text');
}
console.log(JSON.stringify({ locales: coverage.length, keys: Object.keys(ENGLISH).length, missing: counts.missing, hardcoded: counts.hardcoded, complete: report.complete }));
if (process.argv.includes('--strict') && !report.complete) throw new Error('Production localization is incomplete. See test-results/localization.json.');
