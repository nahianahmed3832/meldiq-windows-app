# Typography and feature-button correction

Published November 1, 2026, approximately 02:46 Asia/Shanghai.

Confirmed cause: the Features CTA inherited mint link text over a mint background. Before correction both computed foreground/background were rgb(141,236,224). The primary-link foreground now explicitly uses rgb(16,35,34), including normal/visited/focus states. Live verification confirmed the corrected colours while hovered=false.

Typography changed site-wide to self-hosted Inter Variable, obtained from the official rsms/inter repository with its license retained in public/fonts/Inter-LICENSE.txt. Font preload points to the WOFF2 asset.

The Features page now uses plain headings and capability lists instead of decorative mock conversations and illustrations. Other public-page headings now describe the page directly. Removed the homepage background rings and reduced decorative elements. Existing feature anchors, legal/privacy qualifications, pricing, sign-in and billing functions remain intact.

Validation: lint, 32 unit tests, TypeScript and production build pass. 33 browser checks across 11 public pages at 320/768/1280px confirm Inter, no page overflow, and no primary buttons with identical text/background colours. Eleven WCAG A/AA scans report zero violations. Live Features/button/font verified in browser. Mailbox OTP delivery was not part of this styling change.

Release: site-20261031T184545Z-5b17954d23. Previous release retained: site-20261031T183808Z-e342d5f4c8. Existing website-only deploy script used. Docker, messaging app, core-admin, shared authentication, APIs, database and payment configuration were not changed.
