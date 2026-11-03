import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { SocialFlowStore } from '../main/social-flow';
const id = 'i'.repeat(43), verifier = 'v'.repeat(43), receipt = 'r'.repeat(43);
function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'meldiq-social-'));
  const key = randomBytes(32), filename = path.join(dir, 'pending.sealed');
  // Unit fixture encryption; shipped code injects Electron safeStorage/Windows DPAPI.
  const seal = (text: string) => { const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key, iv); const bytes = Buffer.concat([cipher.update(text), cipher.final()]); return Buffer.concat([iv, cipher.getAuthTag(), bytes]).toString('base64'); };
  const open = (text: string) => { const bytes = Buffer.from(text, 'base64'), decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(0, 12)); decipher.setAuthTag(bytes.subarray(12, 28)); return Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString(); };
  return { filename, seal, open, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}
describe('restart-safe PKCE login proof', () => {
  it('persists encrypted proof, accepts only its matching return after restart, and removes it after completion', () => {
    const f = fixture();
    try {
      let store = new SocialFlowStore(f.filename, f.seal, f.open);
      store.begin({ id, verifier, expiresAt: Date.now() + 60_000 });
      expect(fs.readFileSync(f.filename, 'utf8')).not.toContain(verifier);
      store = new SocialFlowStore(f.filename, f.seal, f.open);
      expect(store.accept('x'.repeat(43), receipt)).toBe(false); expect(store.resume()).toBeNull();
      expect(store.accept(id, receipt)).toBe(true); expect(store.accept(id, receipt)).toBe(false);
      expect(store.resume()).toEqual({ id, verifier, receipt }); expect(store.resume()).toBeNull();
      store.releaseRenderer(); expect(store.resume()).toEqual({ id, verifier, receipt });
      store.clear(id); expect(fs.existsSync(f.filename)).toBe(false);
      expect(new SocialFlowStore(f.filename, f.seal, f.open).accept(id, receipt)).toBe(false);
    } finally { f.cleanup(); }
  });
  it('rejects expired or tampered persisted state and clears cancellation', () => {
    const f = fixture();
    try {
      const clock = () => 1000;
      const store = new SocialFlowStore(f.filename, f.seal, f.open, clock);
      store.begin({ id, verifier, expiresAt: 2000 });
      expect(new SocialFlowStore(f.filename, f.seal, f.open, () => 3000).accept(id, receipt)).toBe(false);
      fs.writeFileSync(f.filename, 'forged');
      expect(new SocialFlowStore(f.filename, f.seal, f.open, clock).resume()).toBeNull();
      store.begin({ id, verifier, expiresAt: 2000 }); store.clear(id);
      expect(store.accept(id, receipt)).toBe(false);
    } finally { f.cleanup(); }
  });
  it('does not clear a newer flow in response to an old canceled ID', () => {
    const f = fixture();
    try {
      const store = new SocialFlowStore(f.filename, f.seal, f.open);
      store.begin({ id, verifier, expiresAt: Date.now() + 60_000 });
      store.clear('x'.repeat(43)); expect(store.accept(id, receipt)).toBe(true);
    } finally { f.cleanup(); }
  });
});
