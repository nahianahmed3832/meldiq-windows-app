import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

export const defaultAcceptancePath = path.join(os.homedir(), 'Library/Application Support/Meldiq/desktop-acceptance.env');
const root = fs.realpathSync(fileURLToPath(new URL('..', import.meta.url)));
const fields = new Set(['API_ORIGIN', 'WS_URL', 'APP_ORIGIN', 'MEDIA_ORIGIN', 'LIVEKIT_URL', 'ORIGINS_APPROVED', 'QA_AUTHORIZED', 'OWNER_REFERENCE', 'QA_COMMUNITY_ID', 'QA_CHANNEL_ID', 'SANDBOX_API_ORIGIN', 'SANDBOX_ISOLATED', 'PAYMENT_MODE', ...['A', 'B', 'C'].flatMap(a => [`QA_${a}_EMAIL`, `QA_${a}_PASSWORD`, `QA_${a}_USER_ID`])].map(k => `MELDIQ_ACCEPTANCE_${k}`));

export function parseAcceptance(text) {
  const values = Object.create(null);
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (!match || !fields.has(match[1]) || Object.hasOwn(values, match[1])) throw new Error(`Invalid or duplicate acceptance field at line ${index + 1}`);
    let value = match[2].trim();
    if (value.startsWith('"')) {
      try { value = JSON.parse(value); } catch { throw new Error(`Invalid quoted acceptance value at line ${index + 1}`); }
      if (typeof value !== 'string') throw new Error(`Expected string at line ${index + 1}`);
    }
    if (/[\r\n\0]/.test(value)) throw new Error(`Multiline acceptance value at line ${index + 1}`);
    values[match[1]] = value;
  }
  for (const suffix of ['API_ORIGIN', 'APP_ORIGIN', 'MEDIA_ORIGIN', 'SANDBOX_API_ORIGIN', 'WS_URL', 'LIVEKIT_URL']) {
    const value = values[`MELDIQ_ACCEPTANCE_${suffix}`];
    if (!value) continue;
    let url;
    try { url = new URL(value); } catch { throw new Error(`Invalid acceptance ${suffix}`); }
    const protocol = ['WS_URL', 'LIVEKIT_URL'].includes(suffix) ? 'wss:' : 'https:';
    if (url.protocol !== protocol || url.username || url.password || url.hash || url.search || (suffix !== 'WS_URL' && url.pathname !== '/')) throw new Error(`Unsafe acceptance ${suffix}`);
  }
  for (const suffix of ['ORIGINS_APPROVED', 'QA_AUTHORIZED', 'SANDBOX_ISOLATED']) {
    const value = values[`MELDIQ_ACCEPTANCE_${suffix}`];
    if (value && !['true', 'false'].includes(value)) throw new Error(`Invalid acceptance ${suffix}`);
  }
  if (values.MELDIQ_ACCEPTANCE_PAYMENT_MODE && !['test', 'sandbox'].includes(values.MELDIQ_ACCEPTANCE_PAYMENT_MODE)) throw new Error('Acceptance transactions require test or sandbox mode');
  if (values.MELDIQ_ACCEPTANCE_SANDBOX_API_ORIGIN && (!values.MELDIQ_ACCEPTANCE_API_ORIGIN || new URL(values.MELDIQ_ACCEPTANCE_SANDBOX_API_ORIGIN).origin === new URL(values.MELDIQ_ACCEPTANCE_API_ORIGIN).origin)) throw new Error('Payment sandbox must use an isolated backend origin');
  return Object.freeze(values);
}

export function loadAcceptance(filename) {
  if (!filename || !path.isAbsolute(filename)) throw new Error('Pass an absolute --env path to the external acceptance file');
  const real = fs.realpathSync(filename);
  if (real === root || real.startsWith(root + path.sep)) throw new Error('Acceptance configuration must remain outside the checkout');
  const stat = fs.statSync(real);
  if (!stat.isFile() || stat.size > 65536) throw new Error('Invalid acceptance configuration file');
  if (process.platform !== 'win32' && (stat.mode & 0o077)) throw new Error('Acceptance configuration requires owner-only permissions (chmod 600)');
  // Data only: no dotenv exports, shell evaluation, interpolation or process.env assignment.
  return parseAcceptance(fs.readFileSync(real, 'utf8'));
}

export function requiredFields(config, suffixes) {
  return suffixes.filter(suffix => !config[`MELDIQ_ACCEPTANCE_${suffix}`]).map(suffix => `MELDIQ_ACCEPTANCE_${suffix}`);
}
