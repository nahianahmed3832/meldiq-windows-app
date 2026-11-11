# Meldiq website (meldiq.app)

Meldiq's public website: product pages, pricing for **Meldiq Plus** ($4.99/month, with files up to 1 GB), sign-up and sign-in with the
same Meldiq account every app uses, account and billing pages, support, community and developer guides, bots, security, roadmap, brand assets, and the legal pages. Live at
**https://meldiq.app** since 2026-10-28.

- Next.js 16 (Pages Router) static export, React 19, TypeScript, zod. No server of its own and no third-party script:
  nginx serves the files with a strict Content-Security-Policy (`script-src 'self'`).
- Account and billing pages call the Meldiq API (`/v2/…`) on the same origin; nginx proxies it to the API.
- The existing web app stays at https://web.meldiq.app; the site only links to it. Android: Google Play.
- Nothing secret lives here. PayPal client secrets and payment-provider credentials exist only in the API server's environment.

## Run

```bash
npm install
```

```bash
MELDIQ_API_UPSTREAM=http://127.0.0.1:8080 npm run dev
```

Or preview the production build against the mock API:

```bash
npm run build && node e2e/mock-api.mjs 8099 & MELDIQ_API_UPSTREAM=http://127.0.0.1:8099 node scripts/serve.mjs out 4190
```

## Check

```bash
npm run typecheck && npm run lint && npm run format:check && npm run test:coverage && npm run build && npm run e2e
```

## Deploy

```bash
npm run build && bash deploy/deploy.sh
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) (rollback: `bash deploy/rollback.sh`).

## Docs

- [Architecture](docs/ARCHITECTURE.md): pages, sessions, billing flow, how the site fits the shared backend
- [Deployment](docs/DEPLOYMENT.md): hosting, nginx, releases, rollback
- [Testing](docs/TESTING.md): what is tested and the latest results
- [Launch blockers](docs/LAUNCH_BLOCKERS.md): details and decisions still needed
- Billing on the server: `meldiq_android/docs/BILLING.md` › Meldiq Mojo and PayPal

## Website refresh (2026-11-04)

Shared responsive marketing layout and persistent light/dark mode across the site. Billing terms are read from
`/v2/mojo/catalog`: a configured quarterly or yearly price is shown as unavailable unless the server explicitly enables it.
The website checkout continues to sell only the approved monthly Plus offer; other available terms are reviewed in the app.
New guide routes: `/community`, `/tutorials`, `/bots`, `/developers`, `/security`, `/roadmap`, `/brand`.
