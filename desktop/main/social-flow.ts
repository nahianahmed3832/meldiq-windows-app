import fs from 'node:fs';
import path from 'node:path';
const TOKEN = /^[A-Za-z0-9_-]{43}$/;
interface PendingSocial { id: string; verifier: string; expiresAt: number; receipt?: string }
/** Short-lived proof only, encrypted with the same OS store as account sessions. Never a session token. */
export class SocialFlowStore {
  private flow: PendingSocial | null = null;
  private leased = false;
  constructor(private filename: string, private seal: (value: string) => string, open: (value: string) => string, private now = Date.now) {
    try {
      const raw = fs.readFileSync(filename, 'utf8');
      if (raw.length > 8192) throw new Error('Oversized pending authorization');
      const flow = JSON.parse(open(raw));
      if (!TOKEN.test(flow.id) || !TOKEN.test(flow.verifier) || !Number.isSafeInteger(flow.expiresAt) || flow.expiresAt <= now() || flow.expiresAt > now() + 15 * 60_000 || flow.receipt !== undefined && !TOKEN.test(flow.receipt)) throw new Error('Invalid pending authorization');
      this.flow = { id: flow.id, verifier: flow.verifier, expiresAt: flow.expiresAt, ...(flow.receipt ? { receipt: flow.receipt } : {}) };
    } catch { this.clear(); }
  }
  private save() {
    fs.mkdirSync(path.dirname(this.filename), { recursive: true });
    fs.writeFileSync(this.filename + '.tmp', this.seal(JSON.stringify(this.flow)), { mode: 0o600 });
    fs.renameSync(this.filename + '.tmp', this.filename);
  }
  begin(flow: PendingSocial) {
    if (!TOKEN.test(flow.id) || !TOKEN.test(flow.verifier) || !Number.isSafeInteger(flow.expiresAt) || flow.expiresAt <= this.now() || flow.expiresAt > this.now() + 15 * 60_000) throw new Error('Invalid pending sign-in');
    const previous = this.flow;
    this.flow = { id: flow.id, verifier: flow.verifier, expiresAt: flow.expiresAt };
    try { this.save(); this.leased = false; } catch (error) { this.flow = previous; throw error; }
  }
  accept(id: string, receipt: string): boolean {
    if (!this.flow || this.flow.id !== id || this.flow.expiresAt <= this.now() || this.flow.receipt || !TOKEN.test(receipt)) return false;
    this.flow.receipt = receipt;
    try { this.save(); return true; } catch { delete this.flow.receipt; return false; }
  }
  resume(): { id: string; verifier: string; receipt: string } | null {
    if (this.flow && this.flow.expiresAt <= this.now()) this.clear();
    if (!this.flow?.receipt || this.leased) return null;
    this.leased = true;
    return { id: this.flow.id, verifier: this.flow.verifier, receipt: this.flow.receipt };
  }
  releaseRenderer() { this.leased = false; }
  clear(id?: string) {
    if (id && this.flow?.id !== id) return;
    this.flow = null; this.leased = false;
    try { fs.rmSync(this.filename, { force: true }); fs.rmSync(this.filename + '.tmp', { force: true }); } catch { /* An expired/used result is still rejected by the backend. */ }
  }
}
