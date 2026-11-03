import fs from 'node:fs/promises';
import { createServer } from 'node:http';
import { build } from 'esbuild';
import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
const output = await build({ stdin: { contents: `import React from 'react';import{createRoot}from'react-dom/client';import{AddDeviceView}from'./src/ui/auth/DeviceSetupViews';
window.meldiqDesktop={};const backup=location.search.includes('backup');const accounts={api:{base:location.origin},keyBackupStatus:async()=>({exists:backup}),startKeyUnlock:async()=>({email:'fixture@example.test',delivery:'email'})};
createRoot(document.getElementById('app')).render(<AddDeviceView creds={{accounts}} account={{id:'fixture-account',email:'fixture@example.test',identity:{identityKey:'fixture-identity'}}} deviceName="Fixture desktop" onEnrolled={()=>{throw Error('An unapproved fixture must not enroll')}} onSignOut={()=>{}}/>);`, loader: 'tsx', resolveDir: fileURLToPath(new URL('../packages/web', import.meta.url)) }, bundle: true, write: false, jsx: 'automatic', format: 'esm', platform: 'browser', define: { 'process.env.NODE_ENV': '"production"' } });
let pairings = 0;
const server = createServer((req, res) => {
  res.setHeader('cache-control', 'no-store');
  res.setHeader('content-security-policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; object-src 'none'");
  if (req.url === '/app.js') { res.setHeader('content-type', 'text/javascript'); return res.end(output.outputFiles[0].text); }
  if (req.url === '/v1/pairing' && req.method === 'POST') { pairings++; res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify({ pairingId: 'fixture-pairing', code: 'AAAAABBBBB', expiresAt: Date.now() + 60000 })); }
  if (req.url.startsWith('/v1/pairing/')) { res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify({ status: 'pending' })); }
  if (req.url === '/' || req.url === '/?backup') { res.setHeader('content-type', 'text/html'); return res.end('<!doctype html><div id="app"></div><script type="module" src="/app.js"></script>'); }
  res.writeHead(404); res.end();
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
const passed = [];
try {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await expect(page.getByRole('heading', { name: 'Finish signing in' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Approve from my phone', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Use my recovery key', exact: true })).toBeVisible();
  assert.equal(pairings, 0); assert.equal(await page.locator('.code-box').count(), 0);
  await fs.mkdir('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/compact-signin-options.png' });
  passed.push('native key restore opens with two simple choices and no automatic pairing request');
  await page.getByRole('button', { name: 'Approve from my phone', exact: true }).click();
  await expect(page.getByText('AAAAA BBBBB', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Check the device key, then approve', { exact: true })).toBeVisible();
  assert.equal(pairings, 1); assert.equal(await page.locator('ol.steps').count(), 0);
  passed.push('phone instructions start only on request and retain the security fingerprint');
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: 'Use my recovery key', exact: true }).click();
  await expect(page.getByLabel('Recovery key', { exact: true })).toBeVisible();
  passed.push('recovery remains accessible without resetting the account identity');
  await page.goto(`http://127.0.0.1:${server.address().port}/?backup`);
  await expect(page.getByLabel('Verification code', { exact: true })).toBeVisible();
  assert.equal(await page.getByRole('button', { name: 'Approve from my phone', exact: true }).count(), 0);
  passed.push('an existing encrypted backup keeps the standard email unlock flow');
  const report = { recordedAt: new Date().toISOString(), scope: 'actual Chromium with synthetic account metadata, no user keys or live account mutation', passed, counts: { passed: passed.length, failed: 0 } };
  await fs.mkdir('test-results', { recursive: true }); await fs.writeFile('test-results/compact-signin-smoke.json', JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify(report));
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
