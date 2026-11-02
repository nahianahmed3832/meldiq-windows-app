import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_PREFERENCES, validatePreferences } from '../shared/policy';
import type { Preferences } from '../shared/contracts';
export class PreferenceStore {
  value: Preferences = { ...DEFAULT_PREFERENCES };
  constructor(private readonly filename: string) {
    try { this.value = { ...this.value, ...validatePreferences(JSON.parse(fs.readFileSync(filename, 'utf8'))) }; }
    catch { /* A missing or corrupt preference file falls back safely; account storage is separate. */ }
  }
  patch(input: unknown): Preferences {
    const next = { ...this.value, ...validatePreferences(input) };
    fs.mkdirSync(path.dirname(this.filename), { recursive: true });
    fs.writeFileSync(`${this.filename}.tmp`, JSON.stringify(next), { mode: 0o600 });
    fs.renameSync(`${this.filename}.tmp`, this.filename);
    this.value = next;
    return next;
  }
}
