// Runs in Electron's main process. Private key material never enters the renderer or tool output.
const { app, safeStorage } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const directory = path.join(os.homedir(), 'Library', 'Application Support', 'Meldiq', 'release-signing');
app.setName('Meldiq Release Signing');
app.setPath('userData', directory);
app.whenReady().then(() => {
  if (process.platform !== 'darwin' || !safeStorage.isEncryptionAvailable()) throw new Error('Unlocked macOS Keychain is required');
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  fs.chmodSync(directory, 0o700);
  const filename = path.join(directory, 'update-private-key.enc');
  const publicFile = path.join(directory, 'update-public-key.json');
  const command = process.argv[2];
  if (command === 'generate') {
    if (!fs.existsSync(filename)) {
      const pair = crypto.generateKeyPairSync('ed25519');
      const pem = pair.privateKey.export({ type: 'pkcs8', format: 'pem' });
      const publicKey = pair.publicKey.export({ type: 'spki', format: 'pem' });
      const keyId = crypto.createHash('sha256').update(pair.publicKey.export({ type: 'spki', format: 'der' })).digest('hex');
      fs.writeFileSync(filename, safeStorage.encryptString(pem), { mode: 0o600, flag: 'wx' });
      fs.writeFileSync(publicFile, JSON.stringify({ algorithm: 'ed25519', keyId, publicKey }, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
    }
    const info = JSON.parse(fs.readFileSync(publicFile, 'utf8'));
    const key = crypto.createPrivateKey(safeStorage.decryptString(fs.readFileSync(filename)));
    const probe = Buffer.from('Meldiq release key possession check');
    if (!crypto.verify(null, probe, info.publicKey, crypto.sign(null, probe, key))) throw new Error('Signing key pair does not match');
    console.log(JSON.stringify({ keyId: info.keyId, publicKeyFile: publicFile, privateKeyStorage: 'macOS Keychain-encrypted file with owner-only permissions', keyPairVerified: true }));
  } else if (command === 'sign') {
    const input = process.argv[3], output = process.argv[4];
    if (!input || !output || !path.isAbsolute(input) || !path.isAbsolute(output)) throw new Error('Use absolute payload and output paths');
    const info = JSON.parse(fs.readFileSync(publicFile, 'utf8'));
    const payload = fs.readFileSync(input);
    if (payload.length > 65536) throw new Error('Release payload is too large');
    JSON.parse(payload.toString('utf8'));
    const key = crypto.createPrivateKey(safeStorage.decryptString(fs.readFileSync(filename)));
    const signature = crypto.sign(null, Buffer.concat([Buffer.from('MELDIQ-DESKTOP-UPDATE-V1\n'), payload]), key).toString('base64');
    fs.writeFileSync(output, JSON.stringify({ payload: payload.toString('base64'), signatures: [{ keyId: info.keyId, signature }] }) + '\n', { mode: 0o600 });
    console.log(JSON.stringify({ keyId: info.keyId, signedFile: output, privateKeyExported: false }));
  } else throw new Error('Use generate or sign');
  app.exit(0);
}).catch(() => { console.error('Release signing failed; private key details withheld.'); app.exit(1); });
