import fs from 'node:fs';
import path from 'node:path';
export const CAPABILITIES = ['microphone', 'camera', 'speakers'] as const;
export type Capability = typeof CAPABILITIES[number];
export type PermissionDecisions = Partial<Record<Capability, boolean>>;
/** Decisions belong only to the packaged, trusted main frame. Windows/OS consent remains separate. */
export class PermissionStore {
  value: PermissionDecisions = {};
  private generation = 0;
  private pending = new Map<string, Promise<boolean>>();
  constructor(private filename: string) {
    try {
      const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
      if (data && typeof data === 'object' && !Array.isArray(data))
        for (const key of CAPABILITIES) if (typeof data[key] === 'boolean') this.value[key] = data[key];
    } catch { /* Missing/corrupt decisions require consent again. */ }
  }
  private save() {
    fs.mkdirSync(path.dirname(this.filename), { recursive: true });
    fs.writeFileSync(this.filename + '.tmp', JSON.stringify(this.value), { mode: 0o600 });
    fs.renameSync(this.filename + '.tmp', this.filename);
  }
  reset() { this.generation++; this.value = {}; this.pending.clear(); this.save(); }
  async request(capabilities: Capability[], ask: () => Promise<boolean>): Promise<boolean> {
    if (!capabilities.length || capabilities.some(c => !CAPABILITIES.includes(c))) return false;
    if (capabilities.some(c => this.value[c] === false)) return false;
    const missing = [...new Set(capabilities.filter(c => this.value[c] !== true))].sort();
    if (!missing.length) return true;
    const key = missing.join(',');
    if (this.pending.has(key)) return this.pending.get(key)!;
    const generation = this.generation;
    const pending = Promise.resolve().then(ask).then(allow => {
      if (generation !== this.generation) return false;
      const previous = { ...this.value };
      for (const c of missing) this.value[c] = allow;
      try { this.save(); } catch { this.value = previous; return false; }
      return allow;
    }, () => false).finally(() => { if (this.pending.get(key) === pending) this.pending.delete(key); });
    this.pending.set(key, pending);
    return pending;
  }
}
export function mediaCapabilities(mediaTypes: readonly string[] | undefined): Capability[] {
  if (!mediaTypes?.length || mediaTypes.some(t => !['audio', 'video'].includes(t))) return [];
  return [...new Set(mediaTypes.map(t => t === 'audio' ? 'microphone' as const : 'camera' as const))];
}
