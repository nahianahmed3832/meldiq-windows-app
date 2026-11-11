# Meldiq website QA report

Initial QA verified November 1, 2026. The owner subsequently authorized the Hostinger deployment; see MELDIQ_HOSTINGER_DEPLOYMENT.md for live verification.

## Passed

| Check | Result |
| --- | --- |
| Production build (`npm run build`) | Passed; 19 exported routes including existing account/auth/404 pages |
| TypeScript (`npm run typecheck`) | Passed |
| ESLint (`npm run lint`) | Passed |
| Formatting (`npm run format:check`) | Passed |
| Unit/contract suite (`npm run test:coverage`) | 32 tests passed across 5 files |
| Unit coverage | Statements 71.77%; branches 72.58%; functions 58.82%; lines 71.94% |
| Public route/metadata/asset/link/anchor audit | 11 public pages passed; zero missing internal destinations, fragments or referenced local assets |
| Strict CSP compatibility | No executable inline scripts; existing same-origin security model retained |
| Protected-source comparison | 26 authentication/account/API/legal-document/deployment files match the original source backup |
| Responsive browser checks | 55 page/viewport combinations: 11 routes × 320, 375, 768, 1024, 1440px; zero horizontal page overflow and one H1 per page |
| Automated WCAG A/AA scans | 22 scans: all 11 routes at 1440 and 375px; zero reported violations after fixes |
| FAQ | Search, category filtering, answer expansion, empty-results message/reset checked in browser |
| Mobile menu | Opening, closing with Escape, focus return checked in browser |
| External destinations | Public site, app and official Play listing reachable with HTTP 200 at audit time |
| Lighthouse mobile audit | Performance 98; accessibility 100; best practices 100; SEO 100 |

Lighthouse 13.6.0 ran against the local optimized production export with default mobile simulation. No runtime errors or run warnings. It measures this local run, not field performance or production network conditions. Automated accessibility success is not a claim of complete WCAG conformance.

## Fixes found by QA

Mobile menu dismissal initially interfered with activation: corrected to pointer-down outside handling, functional toggle and Escape focus return. Corrected legacy primary-button text contrast, Mojo heading contrast, and inline-link underlines. Rechecked all public routes after corrections.

## Verification environment and limits

Browser interaction/viewport QA used the Codex in-app browser. A temporary read-only preview supplied the three audited public configuration responses; it accepted no authentication/payment writes. QA-only axe scripts were supplied locally and are absent from the shipped source/output. Initial asset-loading observations were rechecked after loading; final responsive results have no broken eager images. One transient QA-script load failed during a long batch; the remaining viewport checks completed separately. Dedicated physical iOS/Android devices were not used.

The repository’s browser specifications were updated for the new headings, menu, FAQ, download behavior, non-sale previews and unknown billing state; existing account/session/referral/legal/checkout tests were retained. The full separate Playwright Chromium/phone/WebKit runner was **not executed** in this session. Run it before release for independent engine coverage. No real signup, email-delivery test, Stripe purchase or cryptographic audit was performed.

## Evidence

- `responsive-checks.json`: 55 final page/viewport results.
- `accessibility-checks.json`: 22 final axe results.
- `export-checks.json`: route metadata, links, protected-source comparison.
- `lighthouse-home-mobile.json`: complete Lighthouse report.
- `../meldiq-homepage-desktop.jpg`, `../meldiq-homepage-full.jpg`, `../meldiq-homepage-mobile.jpg`: visual review artifacts.

## Remaining product/content issues

Paid offers remain unavailable in the real configuration. Final paid pricing conflicts with older announcements. Support/privacy email addresses and several legal/business details remain unset. Legal text remains marked draft, with original unconfirmed details visible. These facts are handled honestly in the redesign and still require owner decisions; no backend values were changed.
