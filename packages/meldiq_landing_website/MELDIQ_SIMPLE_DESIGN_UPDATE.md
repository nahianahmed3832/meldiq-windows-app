# Simpler visual update

Published November 1, 2026 at approximately 02:32 Asia/Shanghai.

Reference: https://www.yapper.website/ (reviewed visually). Meldiq now uses a plain dark canvas, one mint accent, a text-led hero, two primary actions, three concise feature summaries, short privacy/Mojo sections and a simple platform list. Floating stickers, overlapping homepage product mockups and scattered decorations were removed. Remaining illustrations are aligned, surfaces are neutral, and shared typography/buttons are consistent.

Changed: homepage, shared presentation stylesheet, and homepage heading assertion in the browser specification. Sign-in routing, account/billing functions, product status, legal routes and backend behavior are retained. Build/type checking, lint and all 32 unit tests pass. Browser checks cover 11 public pages at 320, 768 and 1440 pixels (33 checks), with no page overflow and one H1 per page.

Release: site-20261031T183159Z-4e413aa030. Previous release retained: site-20261031T182119Z-e14bc8a072. Deployment used the existing website-only script. Docker containers, web messaging app, admin, APIs and authentication were not modified.
