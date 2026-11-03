# Deployment

## Where it runs

| | |
|---|---|
| Host | Meldiq VPS 72.60.107.88 (Hostinger), nginx 1.24, behind Cloudflare (proxied) |
| Site | `/etc/nginx/sites-available/meldiq-apex.conf` (copy: `deploy/nginx/meldiq-apex.conf`; source of truth also in `meldiq_android/deploy/nginx/`) |
| Files | `/opt/meldiq-site/releases/<release>/`, live one at `/opt/meldiq-site/current` |
| TLS | Let's Encrypt `meldiq.app` (+ www), renewed by certbot; Cloudflare Full (strict) |
| API | `/v2/` proxied to the API container on 127.0.0.1:18080 (same origin) |

The site never touches the API container, Meldiq Web (`web.meldiq.app`), the admin console or any GriipBuddy site.
nginx keeps: `/invite/…` and `/m/…` → `web.meldiq.app` (links the apps already made), `www` → apex,
`/.well-known/assetlinks.json` from the API (Android App Links), ACME challenges.

## Release

```bash
npm run build && bash deploy/deploy.sh
```

Uploads `out/` as `site-<UTC time>-<content hash>`, switches `current` atomically, reloads nginx, keeps 5 releases.
`--nginx` also installs `deploy/nginx/meldiq-apex.conf` (backup kept; restored automatically if `nginx -t` refuses).
The script refuses a build with an inline script.

## Rollback

```bash
bash deploy/rollback.sh
```

Points `current` back at the previous release (or a named one, e.g. the placeholder) and reloads nginx. The nginx
config backups are `/etc/nginx/sites-available/meldiq-apex.conf.bak-<time>`.

## First release (2026-10-28)

- Release `site-20261028T071154Z-2bfa1d0fc1` replaced the placeholder page; nginx gained the `/v2/` proxy (backup
  `meldiq-apex.conf.bak-20261028T071208Z`).
- Checked live: all 17 pages 200, unknown paths 404, CSP/HSTS/nosniff present, `/invite/…` → web app, www → apex,
  assetlinks 200, `/v2/auth/login` reaches the API, web.meldiq.app and the API (0.51.1, healthy) unaffected.
- API 0.52.0 (billing routes) went live at 07:19 UTC with `BILLING_PROVIDER=none`: `/v2/billing/plans` answers an empty
  catalog, so Meldiq Mojo shows as not on sale until Stripe is set up and the plans are published.
- Release `site-20261028T072145Z-ff4673244d` (07:21 UTC): pricing copy fix.
