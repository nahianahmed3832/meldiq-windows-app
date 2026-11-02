import { execFile } from 'node:child_process';
import path from 'node:path';
export function validSignatureResult(stdout: string, publishers: string[]): boolean {
  try {
    const result = JSON.parse(stdout.replace(/^\uFEFF/, '').trim());
    return result.status === 'Valid' && result.type === 'Authenticode' && typeof result.publisher === 'string' && publishers.includes(result.publisher);
  } catch { return false; }
}
/** Missing PowerShell, timeouts, malformed output, catalog signatures and mismatched publishers all fail closed. */
export function verifyWindowsSignature(publishers: string[], filename: string): Promise<string | null> {
  if (process.platform !== 'win32' || !publishers.length) return Promise.resolve('Windows signature verification is unavailable');
  const script = "$ErrorActionPreference='Stop'; $s=Get-AuthenticodeSignature -LiteralPath $env:MELDIQ_VERIFY_FILE; @{status=$s.Status.ToString(); type=$s.SignatureType.ToString(); publisher=$s.SignerCertificate.GetNameInfo([System.Security.Cryptography.X509Certificates.X509NameType]::SimpleName,$false)} | ConvertTo-Json -Compress";
  const executable = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  return new Promise(resolve => execFile(executable, ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], { timeout: 30_000, maxBuffer: 64 * 1024, windowsHide: true, env: { ...process.env, MELDIQ_VERIFY_FILE: filename } }, (error, stdout) => resolve(!error && validSignatureResult(stdout, publishers) ? null : 'The update signature could not be verified against the approved publisher.')));
}
