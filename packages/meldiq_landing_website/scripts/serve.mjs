/**
 * Serves the static export the way nginx does in production (deploy/nginx/meldiq-site.conf.template): the same
 * security headers, /path -> /path.html, and /v2/ proxied to the API (MELDIQ_API_UPSTREAM). For local previews and the
 * browser tests only; production uses nginx.
 *   node scripts/serve.mjs out 4190
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { gzipSync } from "node:zlib";

const root = path.resolve(process.argv[2] ?? "out");
const port = Number(process.argv[3] ?? 4190);
const canonicalPaths = new Set(
  [...fs.readFileSync(path.join(root, "sitemap.xml"), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(([, url]) => new URL(url).pathname),
);
const upstream = new URL(process.env.MELDIQ_API_UPSTREAM ?? "http://127.0.0.1:8080");

export const SECURITY_HEADERS = {
  "content-security-policy":
    "default-src 'self'; script-src 'self' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.google-analytics.com https://*.googletagmanager.com; font-src 'self'; connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "cross-origin-opener-policy": "same-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
};

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".json": "application/json",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function resolveFile(urlPath) {
  const clean = path.normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  const candidates = [clean, `${clean}.html`, path.join(clean, "index.html")];
  for (const c of candidates) {
    const full = path.join(root, c);
    if (full.startsWith(root) && fs.existsSync(full) && fs.statSync(full).isFile()) return full;
  }
  return null;
}

http
  .createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    if (url.pathname.startsWith("/v2/")) {
      const proxied = http.request(
        { host: upstream.hostname, port: upstream.port, path: url.pathname + url.search, method: req.method, headers: { ...req.headers, host: upstream.host } },
        (up) => {
          res.writeHead(up.statusCode ?? 502, up.headers);
          up.pipe(res);
        },
      );
      proxied.on("error", () => {
        res.writeHead(502, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: { code: "unavailable", message: "The API can't be reached." } }));
      });
      req.pipe(proxied);
      return;
    }
    const canonical = url.pathname === "/index.html" ? "/" : url.pathname.replace(/(?:\.html|\/)$/, "");
    if (canonical !== url.pathname && canonicalPaths.has(canonical)) {
      res.writeHead(308, { location: canonical + url.search });
      res.end();
      return;
    }
    const file = resolveFile(url.pathname);
    const status = file ? 200 : 404;
    const body = fs.readFileSync(file ?? path.join(root, "404.html"));
    const type = file ? (TYPES[path.extname(file)] ?? "application/octet-stream") : TYPES[".html"];
    const cache = url.pathname.startsWith("/_next/static/") ? "public, max-age=31536000, immutable" : "no-cache";
    const compressible = /^(text\/|application\/(json|xml))/.test(type);
    const gzip = compressible && /\bgzip\b/.test(req.headers["accept-encoding"] ?? "");
    res.writeHead(status, {
      ...SECURITY_HEADERS,
      ...(status === 404 || /^\/(?:account|login|signup|verify-email|forgot-password|404)(?:[./]|$)/.test(url.pathname)
        ? { "content-security-policy": SECURITY_HEADERS["content-security-policy"].replace(/ https:\/\/[^ ;]+/g, "") }
        : {}),
      "content-type": type,
      "cache-control": cache,
      ...(compressible ? { vary: "Accept-Encoding" } : {}),
      ...(gzip ? { "content-encoding": "gzip" } : {}),
    });
    res.end(gzip ? gzipSync(body) : body);
  })
  .listen(port, "127.0.0.1", () => console.log(`Meldiq site on http://127.0.0.1:${port} (API ${upstream.origin})`));
