# Windows 0.3.0 production release — 4 November 2026

Windows **0.3.0** is published on the stable updater and [public download page](https://meldiq.app/download). The existing protected Ed25519 release key authenticated the update, as explicitly selected by the owner. Windows Authenticode publisher signing remains unavailable; this release does not claim trusted publisher identity or complete production feature acceptance.

## Released behavior

- Google, Discord, passkey and email use the existing Meldiq authentication system. The website's `/login` now opens the web application's chooser; whitelisted billing/Plus destinations survive the redirect. No access or refresh tokens cross website origins.
- Desktop accounts requiring encryption-key restoration first see a compact **Finish signing in** screen with phone and recovery choices. Phone pairing starts only when selected. The security fingerprint, recovery validation and existing encrypted backup unlock are preserved. An existing account's identity is never reset to hide missing keys.
- The installer includes the canonical Meldiq executable/shortcut icon, per-user protocol registration, browser callback recovery and quiet/muted encrypted-media status fixes from the readiness branch.
- The shared live catalog offers Plus at **USD 4.99/month**. Existing USD 3.99 agreements were not revised. Human PayPal approval is still required; no buyer was charged in this task.

## Immutable release

| Field | Value |
|---|---|
| Source | `32965c1362523d02a801b062ff2a504629d161df` |
| Candidate CI | [41686647408](https://github.com/nahianahmed3832/meldiq-windows-app/actions/runs/41686647408) |
| Windows qualification | [41688751799](https://github.com/nahianahmed3832/meldiq-windows-app/actions/runs/41688751799) |
| Installer | `Meldiq-Setup-0.3.0-x64.exe` |
| Bytes | `124335247` |
| SHA-256 | `65537b02b6c2f722e48a97a1508ff2d1a62216f6702d998d3be902198ca46cad` |
| Release key ID | `abb61b4909c9803f0e1f360b441ef8e65c35c98271fe9957b82d76d48af41f8d` |
| Published UTC | `2026-11-03T18:05:42Z` |
| Feed | `https://meldiq.app/desktop-updates/windows/stable/release.json` |
| Previous metadata backup | `/opt/meldiq-desktop/history/stable-20261103T180542Z.json` |

Publication required successful Windows evidence, exact runtime/source identity, the same existing release key and matching signed size/SHA-256/SHA-512. The immutable installer was promoted before stable metadata under the shared production release lock. The complete public 124,335,247-byte installer was subsequently downloaded and both signed digests verified; public cache headers, checksum and exact website link also passed.

## Validation

- Candidate CI: 109 desktop tests and 928 web tests passed (2 skipped), lint/type checks and compact sign-in Chromium scenarios passed. Compact sign-in specifically checks opt-in pairing, preserved fingerprint, recovery access and the existing-backup flow.
- Native Windows qualification: invalid metadata signature rejected before download; corrupt artifact rejected; automatic download/install on safe exit passed with busy guard and synthetic account/message, OS-sealed session and local-storage retention.
- The **exact public candidate** passed 12 in-place installation/upgrade/reinstall/uninstall checks against the **actual published 0.2.1 installer**, including canonical icon pixels, shortcut target/AppUserModelID, protocol dispatch and profile-fixture retention. This baseline fixture is not an authenticated customer session.
- Final website: production webpack build, typecheck/lint, **49 unit tests passed (2 skipped)** and **96 desktop/phone browser cases passed**. Those payment cases use provider doubles; they do not prove a live transaction.
- Earlier live activation: 149 backend/provider tests passed (1 skipped), 13 hosted callback cases passed, public callback hashes/headers verified, Google/Discord starts reached official provider endpoints. Current production API `/healthz` reports healthy Supabase/PostgreSQL, Redis and LiveKit.
- Production `BILLING_WEB_RETURN_URL` is `https://web.meldiq.app/settings/checkout`, matching the desktop's strict allowed checkout-return route. The website billing URL is distinct. No return query alone grants payment success.

Sanitized receipts: [release-0.3.0](evidence/release-0.3.0/). Full earlier activation and backup scope: [production activation](PRODUCTION_ACTIVATION_20261104.md).

## Website concurrency and reproducibility

The first download-page deployment refused to overwrite a concurrently released website. Its active source/export hashes matched `/Volumes/code_files/meldiq_landing_website`; the newer refresh and billing-term availability guards were preserved in the isolated release source, then the sign-in/download changes were reapplied and validated. Final website source commit: `87a1079`. Active root: `/opt/meldiq-site/releases/site-20261103T181028Z-a07de9ec4e`, replacing `site-20261103T174833Z-18a4f6c773` through the expected-current guard.

The owning non-Git website workspace also received only the shared login helper/page, Windows download data and their updated tests, with a protected local backup before replacement. The original Windows checkout's concurrent outgoing-message work was left untouched.

## Acceptance still pending

The owner deferred physical Windows 10/11 testing and will personally approve real Google/Discord/PayPal flows. Successful signed webhook delivery, durable payment/entitlement activation, refunds/cancellation/renewal/failed-funding lifecycle evidence, pinned-taskbar icon cache visuals and complete 21-language translation coverage are not claimed. Existing encryption keys may still require legitimate phone or recovery approval once on a new device.

The shared sign-in page also displayed an existing automated service incident. Its status-detail URL returned HTTP 500 during this verification, while web sign-in loaded and the API health checks passed. That separate status-service defect was not changed by this Windows/website release and remains open.
