import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/**
 * Meldiq's public website (docs/ARCHITECTURE.md). A static export of the Pages Router, like Meldiq Web: nginx serves
 * the files with a strict Content-Security-Policy (`script-src 'self'`), which the Pages Router's pages meet (their data
 * is a JSON block that never runs). Product and legal pages are rendered at build time; account and billing pages
 * render in the browser and talk to the Meldiq API on the same origin (/v2), so no CORS and no token in a URL.
 *
 * In development `next dev` proxies /v2 to MELDIQ_API_UPSTREAM; in production nginx does.
 * @param {string} phase
 * @returns {import("next").NextConfig}
 */
export default function config(phase) {
  const api = process.env.MELDIQ_API_UPSTREAM ?? "http://127.0.0.1:8080";
  return {
    output: "export",
    trailingSlash: false,
    reactStrictMode: true,
    poweredByHeader: false,
    images: { unoptimized: true },
    env: {
      // Where "Open Meldiq" goes: the existing web app, a separate site this one never replaces.
      NEXT_PUBLIC_WEB_APP_URL: process.env.NEXT_PUBLIC_WEB_APP_URL ?? "https://web.meldiq.app",
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "https://meldiq.app",
    },
    ...(phase === PHASE_DEVELOPMENT_SERVER
      ? {
          async rewrites() {
            return { beforeFiles: [{ source: "/v2/:path*", destination: `${api}/v2/:path*` }], afterFiles: [], fallback: [] };
          },
        }
      : {}),
  };
}
