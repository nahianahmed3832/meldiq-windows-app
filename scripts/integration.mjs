import { _electron as electron, expect } from '@playwright/test';
import { build } from 'esbuild';
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const backend = process.env.ORBIT_SERVER_DIR;
if (!backend || !path.isAbsolute(backend)) throw new Error('Set ORBIT_SERVER_DIR to the existing Meldiq server checkout. This test never uses production.');
await fs.access(path.join(backend, 'src/index.ts'));
const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'meldiq-integration-'));
const port = await new Promise(resolve => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); }); });
const base = `http://127.0.0.1:${port}`;
// Do not inherit any database, AWS, mail-provider, payment, or production credentials into the test server.
const server = spawn(process.execPath, ['--import', pathToFileURL(path.join(backend, 'node_modules/tsx/dist/loader.mjs')).href, path.join(backend, 'src/index.ts')], {
  cwd: backend, env: { PATH: process.env.PATH, APP_ENV: 'development', HOST: '127.0.0.1', PORT: String(port), DATA_DIR: path.join(temp, 'data'), MAIL_TRANSPORT: 'file', MAIL_FILE_DIR: path.join(temp, 'mail'), REGISTRATION_MODE: 'open', WEB_ORIGINS: 'https://web.meldiq.app', LOG_LEVEL: 'error', RATE_LIMIT_PER_MINUTE: '100000', NEW_ACCOUNT_LIMIT_DAYS: '0', REGISTRATION_PER_ADDRESS_PER_HOUR: '0', REGISTRATION_PER_ADDRESS_PER_DAY: '0', REGISTRATION_OPEN_PER_DAY: '0' }, stdio: ['ignore','pipe','pipe'],
});
let logs = '';
server.stdout.on('data', chunk => { logs = (logs + chunk.toString()).slice(-8000); });
server.stderr.on('data', chunk => { logs = (logs + chunk.toString()).slice(-8000); });
let client, peer;
const referencePath = path.resolve('test-results/reference-client.cjs');
try {
  const deadline = Date.now() + 30_000;
  while (true) {
    if (server.exitCode !== null) throw new Error(`Isolated backend failed: ${logs}`);
    try { if ((await fetch(base + '/healthz')).ok) break; } catch { /* wait for isolated server */ }
    if (Date.now() > deadline) throw new Error(`Isolated backend startup timed out: ${logs}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  await fs.mkdir('test-results', { recursive: true });
  client = await electron.launch({ args: ['.'], env: { ...process.env, MELDIQ_TEST_USER_DATA: path.join(temp, 'profile'), MELDIQ_TEST_API_ORIGIN: base } });
  const page = await client.firstWindow();
  const failures = [];
  page.on('pageerror', error => failures.push({pageError:error.message}));
  page.on('response', response => { if (response.status() >= 400) failures.push({path:new URL(response.url()).pathname,status:response.status()}); });
  page.on('requestfailed', request => failures.push({path:new URL(request.url()).pathname, error:request.failure()?.errorText}));
  page.on('console', message => { if(message.type()==='error') failures.push({console:message.text().replace(/Bearer [\w.-]+/g,'Bearer [redacted]').slice(0,800)}); });
  page.on('websocket', socket => {
    failures.push({websocketPath:new URL(socket.url()).pathname});
    socket.on('socketerror', error => failures.push({websocket:error}));
    socket.on('framereceived', frame => { try { failures.push({frameType:JSON.parse(String(frame.payload)).t}); } catch { failures.push({frameType:'binary'}); } });
  });
  client.__failures = failures;
  await page.evaluate(() => {
    const Original = WebSocket;
    window.__desktopSocketDiagnostics = [];
    window.WebSocket = class extends Original {
      constructor(url, protocols) {
        super(url, protocols);
        this.addEventListener('message', event => window.__desktopSocketDiagnostics.push({type:typeof event.data,constructor:event.data?.constructor?.name}));
        this.addEventListener('close', event => window.__desktopSocketDiagnostics.push({close:event.code,reason:event.reason}));
      }
    };
  });
  await page.getByRole('button', { name: 'Continue with email', exact: true }).click();
  const email = `desktop.${Date.now()}@example.test`, password = 'Isolated desktop test password 42!';
  // Create a disposable account through the actual backend, then exercise the real desktop sign-in and enrollment.
  const register = await fetch(base + '/v2/auth/register', { method: 'POST', headers: { 'content-type':'application/json' }, body: JSON.stringify({ name:'Desktop Acceptance', email, password }) });
  assert(register.ok, `Registration rejected (${register.status}): ${await register.text()}`);
  let code;
  for (const name of await fs.readdir(path.join(temp,'mail'))) { const mail = await fs.readFile(path.join(temp,'mail',name),'utf8'); if (mail.includes(`To: ${email}`)) code = mail.split('\n\n').slice(1).join('\n\n').match(/\b(\d{6})\b/)?.[1]; }
  assert(code, 'Verification code was not written by the isolated file mailer');
  const verify = await fetch(base + '/v2/auth/email/verify', { method: 'POST', headers: { 'content-type':'application/json' }, body: JSON.stringify({ email, password, code }) });
  assert(verify.ok, 'Isolated email verification failed');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByRole('button', { name: 'Set up encryption', exact: true }).click();
  await page.getByRole('heading', { name: 'Save your recovery key' }).waitFor();
  await page.getByLabel("I've stored my recovery key somewhere safe.").check();
  await page.getByRole('button', { name: 'Open Meldiq', exact: true }).click();
  await expect(page.locator('.app[data-connection=online]').first()).toBeVisible({ timeout: 30_000 });
  await page.reload();
  await expect(page.locator('.app[data-connection=online]').first()).toBeVisible({ timeout: 30_000 });
  const me = await page.evaluate(() => new Promise((resolve,reject) => {
    const open = indexedDB.open('orbit-web'); open.onerror = () => reject(open.error);
    open.onsuccess = () => { const db = open.result; const q = db.transaction('kv').objectStore('kv').get('device'); q.onsuccess = () => { db.close(); resolve(q.result.userId); }; q.onerror = () => reject(q.error); };
  }));
  await build({ entryPoints:[path.join(backend,'test/support/griipClient.ts')], outfile:referencePath, platform:'node',format:'cjs',bundle:true,packages:'external' });
  const { GriipClient } = createRequire(import.meta.url)(referencePath);
  peer = new GriipClient(base, `peer${Date.now()}`, 'Reference Peer'); peer.serverMessages = true;
  await peer.register(); await peer.connect();
  const dm = (await peer.req('POST','/v1/conversations/dm',{userId:me})).conversation.id;
  await peer.send(dm,{type:'text',text:'Actual desktop interoperability message'});
  await page.evaluate(href => { history.pushState({meldiq:1},'',href); window.dispatchEvent(new Event('meldiq:route')); }, `/dms/c/${dm}`);
  await expect(page.getByRole('log', { name:'Messages' }).getByText('Actual desktop interoperability message', { exact:true })).toBeVisible({ timeout:20_000 });
  const composer = page.locator('textarea').first();
  await composer.fill('Actual desktop response'); await composer.press('Enter');
  const receiveDeadline = Date.now()+20_000;
  while (!peer.received.some(m => m.payload.text === 'Actual desktop response')) { if(Date.now()>receiveDeadline)throw Error('Reference peer did not receive desktop response'); await new Promise(resolve => setTimeout(resolve,100)); }
  await page.screenshot({path:'test-results/real-backend-messaging.png'});
  const report = { recordedAt:new Date().toISOString(), platform:process.platform, backendCommit:execFileSync('git',['-C',backend,'rev-parse','HEAD'],{encoding:'utf8'}).trim(), environment:'isolated local existing Meldiq backend source via tsx; disposable SQLite and file mail; no cloud credentials', passed:['real email/password sign-in','device/encryption enrollment','OS-sealed session restoration after reload','receive message from reference protocol peer','send response to reference peer'], observedCompatibilityIssues:failures.filter(f=>f.status), notTested:['production auth','physical Android','S3','actual voice/video media','screen sharing','payments','Windows installation','complete feature parity'] };
  await fs.writeFile('test-results/integration.json',JSON.stringify(report,null,2)); console.log(JSON.stringify(report,null,2));
} catch (error) {
  if (client?.__failures) console.error(JSON.stringify(client.__failures,null,2));
  if(client?.windows()[0]) console.error('Public runtime config:', await client.windows()[0].evaluate(() => localStorage.getItem('meldiq.config.v1')));
  if(client?.windows()[0]) console.error('Socket data types:', await client.windows()[0].evaluate(() => window.__desktopSocketDiagnostics));
  if(client?.windows()[0]) console.error('Sealed session diagnostics:', await client.windows()[0].evaluate(async () => {
    const db = await new Promise((resolve,reject) => {const open=indexedDB.open('orbit-web');open.onsuccess=()=>resolve(open.result);open.onerror=()=>reject(open.error);});
    try {
      const sealed = await new Promise((resolve,reject) => {const q=db.transaction('kv').objectStore('kv').get('desktopSealedTokens');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});
      if(typeof sealed!=='string') return {stored:typeof sealed};
      try {const tokens=await window.meldiqDesktop.openSession(sealed);return {stored:'sealed',opened:true,accessUnexpired:tokens.accessTokenExpiresAt>Date.now()};}
      catch(error){return {stored:'sealed',opened:false,error:error.message};}
    } finally {db.close();}
  }));
  if(client) { const pages=client.windows(); if(pages[0]) await pages[0].screenshot({path:'test-results/integration-failure.png'}).catch(()=>undefined); }
  throw error;
} finally {
  await peer?.disconnect().catch(()=>undefined);
  if(client){await client.evaluate(({app})=>app.exit(0)).catch(()=>undefined);await client.close().catch(()=>undefined);}
  server.kill('SIGTERM');
  await fs.rm(referencePath,{force:true});
  await fs.rm(temp,{recursive:true,force:true});
}
