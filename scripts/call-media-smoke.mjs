import { _electron as electron, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { randomBytes } from 'node:crypto';
const backend = process.env.ORBIT_SERVER_DIR;
const nativeDir = process.env.ORBIT_NATIVE_PEER_DIR;
if (!backend || !nativeDir) throw new Error('Set ORBIT_SERVER_DIR and ORBIT_NATIVE_PEER_DIR to existing local SDK checkouts. This test never connects to production.');
const { AccessToken, RoomServiceClient } = createRequire(path.join(backend, 'package.json'))('livekit-server-sdk');
const native = await import(pathToFileURL(createRequire(path.join(nativeDir, 'package.json')).resolve('@livekit/rtc-node')).href);
const freePort = () => new Promise(resolve => { const server = net.createServer(); server.listen(0, '127.0.0.1', () => { const port = server.address().port; server.close(() => resolve(port)); }); });
const [port, tcp, udp] = await Promise.all([freePort(), freePort(), freePort()]);
const keyId = 'local-call-regression', secret = randomBytes(32).toString('hex'), callKey = randomBytes(32).toString('base64'), roomName = 'qa-' + randomBytes(8).toString('hex');
const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'meldiq-call-media-'));
const service = spawn(process.env.LIVEKIT_SERVER_BIN || 'livekit-server', ['--bind', '127.0.0.1', '--node-ip', '127.0.0.1', '--keys', `${keyId}: ${secret}`, '--config-body', `port: ${port}\nrtc:\n  tcp_port: ${tcp}\n  udp_port: ${udp}\n  use_external_ip: false\nroom:\n  enable_remote_unmute: true\nlogging:\n  level: error`], { stdio: ['ignore', 'ignore', 'ignore'], env: { PATH: process.env.PATH, HOME: process.env.HOME } });
const relay = http.createServer((req, res) => {
  if (req.url.startsWith('/v')) { res.writeHead(404, { 'content-type': 'application/json' }); res.end('{}'); return; }
  const upstream = http.request({ host: '127.0.0.1', port, path: req.url, method: req.method, headers: req.headers }, result => { res.writeHead(result.statusCode, result.headers); result.pipe(res); });
  upstream.on('error', () => { res.writeHead(502); res.end(); }); req.pipe(upstream);
});
const sockets = new Set();
relay.on('connection', socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)); });
relay.on('upgrade', (req, socket, head) => {
  const upstream = net.connect(port, '127.0.0.1', () => {
    upstream.write(`${req.method} ${req.url} HTTP/${req.httpVersion}\r\n` + req.rawHeaders.reduce((s, value, i, a) => i % 2 ? s : s + `${value}: ${a[i + 1]}\r\n`, '') + '\r\n');
    if (head.length) upstream.write(head); socket.pipe(upstream).pipe(socket);
  });
  upstream.on('error', () => socket.destroy()); socket.on('error', () => upstream.destroy());
});
await new Promise(resolve => relay.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${relay.address().port}`;
let app, peer, toneTimer, source;
const result = { recordedAt: new Date().toISOString(), platform: process.platform, scope: 'packaged Electron renderer/worker, real loopback LiveKit and native encrypted audio; no production connection, user media, provider credentials or account changes' };
try {
  await expect.poll(async () => fetch(`http://127.0.0.1:${port}`).then(r => r.ok, () => false), { timeout: 15_000 }).toBe(true);
  const token = async identity => { const token = new AccessToken(keyId, secret, { identity, ttl: '5m' }); token.addGrant({ room: roomName, roomJoin: true, canPublish: true, canSubscribe: true }); return token.toJwt(); };
  peer = new native.Room();
  await peer.connect(`ws://127.0.0.1:${port}`, await token('native-peer'), { autoSubscribe: true, encryption: { keyProviderOptions: { sharedKey: new TextEncoder().encode(callKey) } } });
  source = new native.AudioSource(48000, 1);
  const track = native.LocalAudioTrack.createAudioTrack('synthetic-tone', source);
  const publication = await peer.localParticipant.publishTrack(track, new native.TrackPublishOptions({ source: native.TrackSource.SOURCE_MICROPHONE }));
  let frameIndex = 0;
  toneTimer = setInterval(() => {
    const frame = native.AudioFrame.create(48000, 1, 4800);
    for (let i = 0; i < frame.data.length; i++) frame.data[i] = Math.round(Math.sin((frameIndex * 4800 + i) * 2 * Math.PI * 440 / 48000) * 6000);
    frameIndex++; void source.captureFrame(frame).catch(() => undefined);
  }, 100);
  app = await electron.launch({ args: ['.'], env: { ...process.env, MELDIQ_TEST_USER_DATA: profile, MELDIQ_TEST_API_ORIGIN: base }, timeout: 60_000 });
  const page = await app.firstWindow();
  await page.getByRole('button', { name: 'Desktop settings', exact: true }).waitFor();
  const manifest = JSON.parse(await fs.readFile('dist/renderer/asset-manifest.json', 'utf8'));
  const modulePath = '/' + manifest.find(file => /assets\/livekitSession-.*\.js$/.test(file));
  const grant = { url: base.replace('http:', 'ws:'), token: await token('desktop-peer') };
  await page.evaluate(async ({ modulePath, grant, callKey }) => {
    const { LiveKitSession } = await import(modulePath);
    const start = async (key = callKey) => {
    const status = window.__callRegression = { security: 'verifying', flow: 'none', errors: [], samples: [] };
    const noop = () => undefined;
    const media = window.__mediaRegression = new LiveKitSession({ changed: noop, remoteJoined: noop, remoteLeft: noop, audioBlocked: noop, reconnecting: noop, reconnected: noop, disconnected: reason => status.errors.push(reason), security: value => { status.security = value; }, flow: value => { status.flow = value; status.samples.push({ flow: value, security: status.security }); } });
    await media.prepare(false, { microphone: false });
    await media.connect(grant, key);
    };
    window.__restartCallRegression = async key => { await window.__mediaRegression?.disconnect(); await start(key); };
    await start();
  }, { modulePath, grant, callKey });
  const status = () => page.evaluate(() => ({ ...window.__callRegression, tracks: window.__mediaRegression.tracker.snapshot(), participants: window.__mediaRegression.participants().map(p => ({ micOn: p.micOn, isLocal: p.isLocal })) }));
  await expect.poll(async () => (await status()).security, { timeout: 30_000 }).toBe('encrypted');
  await expect.poll(async () => (await status()).flow, { timeout: 15_000 }).toBe('flowing');
  result.active = await status();
  const admin = new RoomServiceClient(`http://127.0.0.1:${port}`, keyId, secret);
  await admin.mutePublishedTrack(roomName, 'native-peer', publication.sid, true);
  await expect.poll(async () => (await status()).participants.find(p => !p.isLocal)?.micOn).toBe(false);
  await page.waitForTimeout(7000);
  result.muted = await status();
  await admin.mutePublishedTrack(roomName, 'native-peer', publication.sid, false);
  await expect.poll(async () => (await status()).security, { timeout: 15_000 }).toBe('encrypted');
  await expect.poll(async () => (await status()).flow, { timeout: 15_000 }).toBe('flowing');
  result.resumed = await status();
  await admin.mutePublishedTrack(roomName, 'native-peer', publication.sid, true);
  await page.evaluate(() => window.__restartCallRegression());
  await expect.poll(async () => (await status()).security, { timeout: 15_000 }).toBe('waiting');
  await expect.poll(async () => (await status()).flow, { timeout: 15_000 }).toBe('quiet');
  result.initiallyMuted = await status();
  await admin.mutePublishedTrack(roomName, 'native-peer', publication.sid, false);
  await expect.poll(async () => (await status()).security, { timeout: 15_000 }).toBe('encrypted');
  result.initiallyMutedThenResumed = await status();
  // A new connection with the wrong key must not inherit proof from the previous one.
  await page.evaluate(key => window.__restartCallRegression(key), randomBytes(32).toString('base64'));
  await expect.poll(async () => (await status()).security, { timeout: 20_000 }).toBe('problem');
  result.wrongKey = { security: (await status()).security, attachedAudio: await page.evaluate(() => window.__mediaRegression.audioBox.childElementCount) };
  if (result.wrongKey.attachedAudio !== 0) throw new Error('Unverified audio was attached for playback');
  result.mutedFalseReconnect = result.muted.flow === 'stalled';
  await fs.writeFile('test-results/call-media-smoke.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  if (process.argv.includes('--assert-fixed')) {
    if (result.mutedFalseReconnect) throw new Error('Muted participant incorrectly reports media reconnection');
    if (result.muted.security !== 'encrypted') throw new Error('Muting discarded valid encryption proof for an unchanged track');
  }
} catch (error) {
  result.error = error.message;
  if (app) result.diagnostics = await (await app.firstWindow()).evaluate(() => ({ state: window.__callRegression, tracks: window.__mediaRegression?.tracker.snapshot() })).catch(() => null);
  await fs.writeFile('test-results/call-media-smoke-failure.json', JSON.stringify(result, null, 2));
  throw error;
} finally {
  clearInterval(toneTimer);
  if (app) { await (await app.firstWindow()).evaluate(() => window.__mediaRegression?.disconnect()).catch(() => undefined); await app.evaluate(({ app }) => app.exit(0)).catch(() => undefined); await app.close().catch(() => undefined); }
  await peer?.disconnect().catch(() => undefined);
  service.kill('SIGTERM'); for (const socket of sockets) socket.destroy(); await new Promise(resolve => relay.close(resolve));
  await source?.close().catch(() => undefined);
  await native.dispose?.();
  await fs.rm(profile, { recursive: true, force: true });
}
