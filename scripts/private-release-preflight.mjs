import fs from 'node:fs';
import crypto from 'node:crypto';
if (process.env.MELDIQ_PRIVATE_UPDATE_RELEASE !== '1') throw new Error('Private-key release packaging requires explicit release authorization');
const key = JSON.parse(fs.readFileSync('config/update-key.json', 'utf8'));
const publicKey = crypto.createPublicKey(key.publicKey);
if (publicKey.asymmetricKeyType !== 'ed25519' || crypto.createHash('sha256').update(publicKey.export({ type: 'spki', format: 'der' })).digest('hex') !== key.keyId) throw new Error('Invalid pinned release key');
const config = JSON.parse(fs.readFileSync('config/desktop.json', 'utf8'));
if (new URL(config.updateOrigin).href !== 'https://meldiq.app/desktop-updates') throw new Error('Private release must use the approved website feed');
console.log('Owner-authorized release-key candidate; publication requires native upgrade evidence and a locally signed manifest.');
