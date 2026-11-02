# Architecture audit

Audit date: 2026-11-03. Repository metadata: repository-audit.json. Initial destination repository was empty; origin is git@github.com:nahianahmed3832/meldiq-windows-app.git.

The existing web client is Next.js 16.4.3 / React 19.3.1 / TypeScript 5.9.3, static exported with a single client-side UI and custom History API router. Source Root.tsx imports no server business logic. Only router events tie the shared application to Next. Desktop can compile the same feature modules with Vite, using a tiny router-events adapter and a desktop entry point, without running a Next server or loading hosted HTML.

Android is Kotlin/Compose; its repository also contains the Fastify 5.12.7 Node backend (server package 0.75.1). API clients use bearer tokens, Zod contracts, rotating account sessions and device signatures. TokenVault seals web tokens with a non-extractable IndexedDB AES key; desktop will add OS-backed encryption. E2EE protocol/crypto modules and IndexedDB history remain shared. No database schema changes are required. Backend source includes MongoDB, SQLite, existing S3 storage, SES, Stripe and LiveKit. Separate web/admin/release worktrees are modified and must not be changed by this task.

Realtime uses /v1/ws and existing frame contracts. Calls use lazy-loaded livekit-client 2.22.3, encrypted media workers, existing manager/reconnection and track cleanup. Screen sharing needs Electron source selection. Notifications currently use browser Notification with service-worker/FCM fallback; desktop must keep a realtime renderer alive in the tray and use native notifications, without web service-worker shell updates.

Media uses existing API, signed S3 flow, resumable transfers, WebP/image processing and backend attachment policies. Media Cache API retention is explicitly OFF in current source (store/mediaCache.ts); preserve that product policy. Add separate temporary Chromium cache settings, without clearing IndexedDB, localStorage, account keys or tokens.

Account social login currently uses a browser popup and challenge/verifier/receipt proof; providers may refuse embedded user agents. Desktop needs system-browser return compatibility; do not falsely certify social login without that test. PayPal is loaded from its approved hosts and prices/entitlements come from the authenticated backend. Keep that architecture; embedded checkout and browser return need provider acceptance.

UI assets, design tokens, profile customization, Plus/Spark/gifts, points, creator programme, OAuth apps, official bots, discovery and lobby are all present. Every UI module is recorded in the source-derived inventory. Original unit and browser tests are available; no end-to-end feature is marked verified merely by reusing it.

Decision: Electron + React + TypeScript, electron-builder full NSIS x64 installer, electron-updater. The entire reusable client is an audited vendored package because no published shared package exists and the upstream working tree contains uncommitted product fixes. Preserve provenance and file hashes; keep desktop modifications small and listed. This avoids silently omitting those fixes or writing to the original web repository. A later shared workspace extraction can replace the snapshot.

The local-only renderer uses an intercepted HTTPS origin scoped to an isolated Electron session, preserving the existing API origin contracts. Packaged files are served from disk; only /v1 and /v2 endpoints go to the existing backend. No hosted HTML fallback is permitted; API HTML is rejected in the main renderer. Service workers cannot replace the packaged UI. Remote frames receive no preload. CSP, main-frame sender checks, navigation restrictions and fuses protect the native bridge.

Public read-only probes to web.meldiq.app/config.json, /v1/health and /v2/auth/social/config returned HTTP 403 on this host. Production connectivity/authenticated compatibility is therefore unverified; no production mutations were attempted. Signing certificate, approved release CDN/DNS, Windows hardware benchmarks and provider return configuration are release blockers, not reasons to fake completion.
