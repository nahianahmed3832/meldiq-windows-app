# Minimal landing update

Published November 1, 2026 at approximately 02:38 Asia/Shanghai.

The user requested a landing page much closer to the previously supplied Yapper reference, retaining Meldiq’s theme. The homepage now has one left-aligned three-line hero, two clear actions, subtle background rings, one short three-column overview and a compact footer. The header contains Download, Features, Mojo and a single sign-in action. Meldiq’s navy/mint palette, original mascot and original copy are retained. Other public pages and account/legal destinations remain available; removed header links remain accessible through the footer.

Changes are limited to homepage, shared header/footer presentation and stylesheet. No authentication, OTP, billing, messaging, admin, database, Docker or API changes. The existing web-app sign-in destination is retained.

Validation: lint, all 32 unit tests, type checks and production build passed. Browser checks: 11 public pages at 320/768/1280 widths (33 checks), no horizontal page overflow and one H1 per page. Mobile menu and Escape dismissal checked. Live homepage, Features, Pricing, account login, messaging app and admin landing pages checked after release.

Release: site-20261031T183808Z-e342d5f4c8; previous release site-20261031T183159Z-4e413aa030 retained for rollback. Existing website-only deployment script used without nginx configuration replacement.
