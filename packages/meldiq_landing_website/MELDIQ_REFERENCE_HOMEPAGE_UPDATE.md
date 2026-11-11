# Meldiq reference homepage update

Published November 1, 2026, 02:02 UTC (10:02 Asia/Shanghai).

Live: https://meldiq.app/
Release: `site-20261101T020235Z-0994077b46`
Previous website release: `site-20261031T184545Z-5b17954d23`

## What changed

The homepage now follows the reference site's full composition: compact centered navigation, a large left-aligned headline, two actions, a large product illustration, two alternating feature rows, a centered invitation, five native FAQ accordions and a four-column footer. Meldiq's logo, mint accent, destinations and factual product copy are retained. Product illustrations are explicitly labelled sample content. No competitor screenshot or logo is presented as Meldiq.

Poppins is self-hosted for the homepage; other pages retain the Inter typography from the preceding update. A functioning light/dark preference is available from the homepage header and mobile navigation. The homepage stylesheet is scoped to avoid changing account, billing and other pages.

## Validation of this release

- TypeScript, production build, lint and all 32 existing unit tests passed.
- All 18 generated HTML files checked: no missing local link or asset targets.
- Automated WCAG A/AA checks: homepage desktop dark, desktop light and 320px dark, plus Features at 320px; zero reported violations in each scan.
- Desktop at 1280px and mobile at 375px/320px reviewed. No horizontal overflow observed. Mobile menu opens/closes, FAQ answers expand, theme switches and persists after reload.
- Features “Find your people” has normal-state dark text `#102322` on mint `#8dece0`; its destination remains `/signup`.
- Published homepage displays Poppins, both feature rows and the existing https://web.meldiq.app/ sign-in destination.
- Public website, messaging web app and admin each returned HTTP 200 after publication.
- Messaging API, LiveKit and notifications containers retain their original start times and zero restarts. The nginx site configuration timestamp remains October 28. No Docker mutation or API/admin deployment was performed. Deployment used the existing website script without `--nginx`.

The full separate 99-case browser runner and a new Lighthouse audit were not run for this visual update. Earlier reports and screenshots describe their respective earlier releases. No real account, email OTP delivery, payment or signed-in messaging workflow was exercised for this update.

## Evidence

- `../meldiq-reference-layout-live.jpg`: live desktop homepage.
- `../meldiq-reference-layout-features.jpg`: live feature section.
- `../meldiq-reference-layout-mobile.jpg`: live mobile homepage.
- Updated source and static-build ZIPs in the parent folder, with hashes in `release-artifacts.json`.

The existing website rollback script can restore the previous retained release. The current release does not change backend, Docker, messaging or admin configuration.
