import { net, type Session } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ORIGIN, isAppPath } from '../shared/policy';
export interface NetworkConfig { apiOrigin: string; websocketUrl: string; connectOrigins: string[] }
// Inherit only explicit HTTPS connection origins from the same trusted web
// release. Scripts, navigation, frames and local files retain desktop policy.
export function webConnectionOrigins(policy: string | null): string[] {
  const sources = policy?.split(';').map(d => d.trim().split(/\s+/)).find(d => d[0] === 'connect-src');
  return (sources ?? []).slice(1).filter(source => /^https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(source));
}
export function contentSecurityPolicy(config: NetworkConfig): string {
  const connections = [ORIGIN, config.apiOrigin, new URL(config.websocketUrl).origin, ...config.connectOrigins, 'https://*.paypal.com', 'https://www.paypalobjects.com'].join(' ');
  return `default-src 'self'; script-src 'self' https://www.paypal.com https://www.paypalobjects.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://*.paypal.com https://www.paypalobjects.com; media-src 'self' blob:; font-src 'self'; connect-src ${connections}; frame-src https://www.youtube-nocookie.com https://*.paypal.com; object-src 'none'; base-uri 'none'; form-action https://*.paypal.com; frame-ancestors 'none'`;
}
export function localAsset(root: string, pathname: string, files: Set<string>): string | null {
  let decoded: string;
  try { decoded = decodeURIComponent(pathname); } catch { return null; }
  if (decoded.includes('\\') || decoded.includes('\0') || decoded.split('/').some(p => p === '.' || p === '..')) return null;
  const relative = decoded.replace(/^\//, '');
  if (files.has(relative)) return path.join(root, relative);
  if (isAppPath(pathname) || pathname === '/capture-picker') return path.join(root, 'index.html');
  return null;
}
export async function installProtocol(ses: Session, root: string, config: NetworkConfig): Promise<void> {
  const files = new Set<string>(JSON.parse(await fs.readFile(path.join(root, 'asset-manifest.json'), 'utf8')));
  let origins: string[] = [];
  try {
    const response = await ses.fetch(config.apiOrigin, { method: 'HEAD', redirect: 'error', credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(4000) });
    if (response.ok) origins = webConnectionOrigins(response.headers.get('content-security-policy'));
  } catch { /* The packaged renderer still opens when the web service is offline. */ }
  const headers = { 'Content-Security-Policy': contentSecurityPolicy({ ...config, connectOrigins: [...new Set([...config.connectOrigins, ...origins])] }), 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-store' };
  ses.protocol.handle('https', async request => {
    const url = new URL(request.url);
    if (url.origin !== ORIGIN) return ses.fetch(request, { bypassCustomProtocolHandlers: true });
    // The bundle owns all documents and executable code. The API relay is bounded to the existing versioned API.
    if (/^\/v[12]\//.test(url.pathname)) {
      if (request.destination === 'document' || request.destination === 'script' || request.destination === 'worker') return new Response('API documents are not application pages', { status: 403, headers });
      const remote = new URL(url.pathname + url.search, config.apiOrigin);
      try {
        const res = await ses.fetch(new Request(remote, request), { bypassCustomProtocolHandlers: true, redirect: 'error' });
        const safe = new Headers(res.headers);
        safe.set('Content-Security-Policy', headers['Content-Security-Policy']);
        safe.set('X-Content-Type-Options', 'nosniff');
        return new Response(res.body, { status: res.status, statusText: res.statusText, headers: safe });
      } catch { return new Response('API unavailable', { status: 502, headers }); }
    }
    if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 405, headers });
    if (url.pathname === '/config.json') return Response.json({ apiBase: '', wsUrl: config.websocketUrl, publicUrl: ORIGIN, environment: 'production', firebase: null }, { headers });
    if (url.pathname === '/sw.js') return new Response(null, { status: 404, headers });
    const filename = localAsset(root, url.pathname, files);
    if (!filename) return new Response('Not found', { status: 404, headers });
    const res = await net.fetch(pathToFileURL(filename).href);
    const merged = new Headers(res.headers);
    Object.entries(headers).forEach(([name, value]) => merged.set(name, value));
    return new Response(request.method === 'HEAD' ? null : res.body, { status: res.status, headers: merged });
  });
}
