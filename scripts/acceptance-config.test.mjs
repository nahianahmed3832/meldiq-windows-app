import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadAcceptance, parseAcceptance } from './acceptance-config.mjs';

test('acceptance values stay in data and never become build environment variables', () => {
  const before = process.env.MELDIQ_ACCEPTANCE_QA_A_PASSWORD;
  const c = parseAcceptance('MELDIQ_ACCEPTANCE_QA_A_PASSWORD="literal $(echo secret) `cmd` # value"');
  assert.equal(c.MELDIQ_ACCEPTANCE_QA_A_PASSWORD, 'literal $(echo secret) `cmd` # value');
  assert.equal(process.env.MELDIQ_ACCEPTANCE_QA_A_PASSWORD, before);
  assert.ok(Object.isFrozen(c));
});
test('reject injection fields, duplicate fields, URL credentials, paths and live payments without echoing values', () => {
  for (const text of ['VITE_SECRET=private', 'export MELDIQ_ACCEPTANCE_QA_A_PASSWORD=private', 'MELDIQ_ACCEPTANCE_API_ORIGIN=https://user:private@example.test', 'MELDIQ_ACCEPTANCE_API_ORIGIN=https://example.test/path', 'MELDIQ_ACCEPTANCE_QA_A_PASSWORD=private\nMELDIQ_ACCEPTANCE_QA_A_PASSWORD=private', 'MELDIQ_ACCEPTANCE_PAYMENT_MODE=live']) {
    assert.throws(() => parseAcceptance(text), e => !e.message.includes('private'));
  }
  assert.throws(() => parseAcceptance('MELDIQ_ACCEPTANCE_API_ORIGIN=https://example.test\nMELDIQ_ACCEPTANCE_SANDBOX_API_ORIGIN=https://example.test'));
});
test('loader refuses checkout files and broadly readable files', () => {
  assert.throws(() => loadAcceptance(path.resolve('config/desktop-acceptance.env.example')), /outside/);
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'meldiq-acceptance-'));
  const filename = path.join(temp, 'private.env');
  try {
    fs.writeFileSync(filename, 'MELDIQ_ACCEPTANCE_API_ORIGIN=https://example.test', { mode: 0o600 });
    assert.equal(loadAcceptance(filename).MELDIQ_ACCEPTANCE_API_ORIGIN, 'https://example.test');
    if (process.platform !== 'win32') { fs.chmodSync(filename, 0o644); assert.throws(() => loadAcceptance(filename), /owner-only/); }
  } finally { fs.rmSync(temp, { recursive: true }); }
});
