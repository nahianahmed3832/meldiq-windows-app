import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
const origin = 'https://web.meldiq.app';
const id = 'a'.repeat(43), receipt = 'b'.repeat(43), state = 'c'.repeat(43);
const files = {
  '/desktop-bridge.html': 'packages/web/public/desktop-bridge.html',
  '/desktop-bridge.js': 'packages/web/public/desktop-bridge.js',
  '/social-auth-callback.html': 'packages/web/public/social-auth-callback.html',
  '/social-auth-callback.js': 'packages/web/public/social-auth-callback.js',
  '/discord/callback': 'desktop/hosted/discord-callback.html',
  '/discord/callback/': 'desktop/hosted/discord-callback.html',
  '/desktop-discord-return.js': 'desktop/hosted/desktop-discord-return.js',
};
const bodies = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([url, file]) => [url, await fs.readFile(file, 'utf8')])));
const browser = await chromium.launch({ headless: true });
const passed = [];
async function scenario(name, pending, path, check) {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  try {
    await context.addInitScript(({ pending }) => {
      if (!sessionStorage.getItem('fixture-initialized')) {
        sessionStorage.setItem('fixture-initialized', 'yes');
        if (pending) sessionStorage.setItem('meldiq.desktop.browserFlow', JSON.stringify(pending));
      }
    }, { pending });
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) return route.abort();
      const body = bodies[url.pathname] ?? '<!doctype html><title>Existing web application fixture</title><main>Home</main>';
      await route.fulfill({ status: 200, contentType: url.pathname.endsWith('.js') ? 'text/javascript' : 'text/html', headers: { 'cache-control': 'no-store', 'content-security-policy': "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'" }, body });
    });
    const page = await context.newPage();
    await page.goto(origin + path);
    try { await check(page); }
    catch (error) { console.error(JSON.stringify({ scenario: name, url: page.url(), text: await page.locator('body').innerText() })); throw error; }
    passed.push(name);
  } finally { await context.close(); }
}
const social = { kind: 'social', id, expires: Date.now() + 300_000 };
const discord = { kind: 'discord', state, expires: Date.now() + 300_000 };
const failed = page => expect(page.getByRole('status')).toContainText(/expired|no longer connected/);
const handoff = async (page, kind, values) => {
  const link = page.getByRole('link', { name: 'Open Meldiq for Windows' });
  await expect(link).toBeVisible();
  const url = new URL(await link.getAttribute('href'));
  assert.equal(url.protocol, 'meldiq:'); assert.equal(url.hostname, kind);
  assert.deepEqual(Object.fromEntries(new URLSearchParams(url.hash.slice(1))), values);
  assert.equal(new URL(page.url()).hash, '');
};
try {
  await scenario('social receipt returns through state-bound desktop bridge', social, `/social-auth-callback.html#id=${id}&receipt=${receipt}`, p => handoff(p, 'auth', { id, receipt }));
  await scenario('uninitiated native social handoff rejected', null, `/desktop-bridge.html#kind=social-return&id=${id}&receipt=${receipt}`, failed);
  await scenario('mismatched social flow rejected', { ...social, id: 'd'.repeat(43) }, `/desktop-bridge.html#kind=social-return&id=${id}&receipt=${receipt}`, failed);
  await scenario('expired social flow rejected', { ...social, expires: Date.now() - 1 }, `/desktop-bridge.html#kind=social-return&id=${id}&receipt=${receipt}`, failed);
  await scenario('duplicate social result rejected', social, `/desktop-bridge.html#kind=social-return&id=${id}&id=${id}&receipt=${receipt}`, failed);
  await scenario('Discord desktop return filters provider extras', discord, `/discord/callback?state=${state}&code=one-use-code&guild_id=123456789&permissions=8`, p => handoff(p, 'discord', { state, code: 'one-use-code', guild_id: '123456789' }));
  await scenario('Discord trailing-slash callback preserves the one-use return', discord, `/discord/callback/?state=${state}&code=one-use-code`, p => handoff(p, 'discord', { state, code: 'one-use-code' }));
  await scenario('Discord denied consent returns cancellation', discord, `/discord/callback?state=${state}&error=access_denied`, p => handoff(p, 'discord', { state, error: 'access_denied' }));
  await scenario('mismatched Discord state rejected', discord, `/discord/callback?state=${'d'.repeat(43)}&code=one-use-code`, failed);
  await scenario('expired Discord state rejected', { ...discord, expires: Date.now() - 1 }, `/discord/callback?state=${state}&code=one-use-code`, failed);
  await scenario('duplicate Discord parameter rejected', discord, `/discord/callback?state=${state}&code=a&code=b`, failed);
  await scenario('existing web Discord return contract retained', null, `/discord/callback?state=${state}&code=web-code&guild_id=123456789`, async p => {
    await p.waitForURL(origin + '/home');
    assert.deepEqual(await p.evaluate(() => JSON.parse(sessionStorage.getItem('meldiq.discordReturn'))), { kind: 'connected', code: 'web-code', state, guildId: '123456789' });
  });
  await scenario('existing web Discord cancellation retained', null, '/discord/callback?error=access_denied', async p => {
    await p.waitForURL(origin + '/home');
    assert.deepEqual(await p.evaluate(() => JSON.parse(sessionStorage.getItem('meldiq.discordReturn'))), { kind: 'cancelled' });
  });
  const report = { recordedAt: new Date().toISOString(), scope: 'actual Chromium, isolated origin routing and synthetic one-use codes only; no live provider account approval', passed, counts: { passed: passed.length, failed: 0 } };
  await fs.mkdir('test-results', { recursive: true });
  await fs.writeFile('test-results/hosted-auth-smoke.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
} finally { await browser.close(); }
