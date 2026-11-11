# Meldiq Hostinger deployment

Deployed November 1, 2026 at approximately 02:00 Asia/Shanghai (October 31, 18:00 UTC), after the owner requested publication to the existing Hostinger host.

- Live website: https://meldiq.app/
- New release: `site-20261031T180015Z-1b01bd6e04`.
- Previous release retained: `site-20261029T203808Z-158cc71ea8`.
- Method: existing `bash deploy/deploy.sh`, without `--nginx`.
- Scope: public website static files under `/opt/meldiq-site/releases`, followed by the existing atomic current-release switch and graceful nginx reload.
- The nginx configuration file was not modified (its timestamp remains October 28). No Docker image, container, compose file, messaging application, API, Android app, core-admin, database, authentication or Stripe configuration was changed. No Docker stop, restart, rebuild or deployment command was run.

## Verified after deployment

All 11 public pages, existing registration/login/recovery/account shells, three public API configuration endpoints, robots, sitemap and Android asset links returned HTTP 200. Public-page CSP and nosniff headers remain present. Live mobile navigation opens and closes; FAQ search filters to four encryption answers; pricing loads the real non-sale and non-enforced status. No browser errors were reported during those smoke checks.

`https://web.meldiq.app/` and `https://admin.meldiq.app/` both returned HTTP 200. The messaging API and notifications containers report healthy. Messaging API, LiveKit, notifications and the existing admin container have start dates before this deployment and restart counts of zero. nginx is active. These are service/landing-page health checks, not a test of every signed-in messaging or administrative workflow.

The fresh production build and all 32 unit tests passed before upload. The previously documented 99-case separate Playwright matrix has not been run. Existing legal drafts/contact gaps and paid-plan availability were intentionally not changed.

Rollback is available using the existing website rollback script and the previous release named above. Related evidence: `live-deployment-checks.json`, `related-service-checks.json`, and the live screenshot at `../meldiq-live-deployed.jpg`.
