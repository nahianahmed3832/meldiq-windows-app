# Testing

Latest public-site verification: [12 November 2026 redesign release](public-pages-20261112/README.md), with 65 unit/contract tests, 222 browser checks and 33 final contrast regressions passing. The report also records live verification and homepage image equality; the dated results below remain historical.

| Suite | Command | Result (2026-10-28) |
|---|---|---|
| Unit (lib: API client, session, money, plans, validation, site, device detection, invite links, navigation) | `npm run test:coverage` | 31 passed |
| Contracts against the server's schemas (`../meldiq_android/server`) | part of `npm test` | passed (skipped when that checkout isn't beside this one) |
| Browser: desktop Chromium, phone-sized Chromium, WebKit | `npm run build && npm run e2e` | 114 passed (device suggestions for Android, iPhone, Mac, Windows, Linux; every header and footer link; trials and invite links) |
| Typecheck, lint, format | `npm run typecheck`, `lint`, `format:check` | pass |

Browser tests run the production build with production's headers (`scripts/serve.mjs`) against a mock of the account
and billing API (`e2e/mock-api.mjs`, fixtures checked against the server's contracts). They cover every public route,
SEO tags, no sideways scroll at any width, headers and no inline script, 404, navigation and the phone menu, pricing
(Meldiq Plus $4.99 monthly, retired offers excluded, separate organization add-ons), the "not on sale yet" state and an API without billing routes,
sign-in redirects, the disclosures and required agreement before payment, that checkout sends only `{ planKey }`, the
hand-over to Stripe (intercepted), sign-up with verification, refused sign-ins and two-step codes, open-redirect
protection, password reset, waiting for the server after Stripe, and a canceled checkout.

**Not tested here:** a real Stripe account (no keys exist; the server's suite uses a fake of Stripe's API with genuinely
signed webhooks), real email delivery, real devices. The server's billing behaviour is tested in
`meldiq_android/server/test/billing_stripe.test.ts` (28 tests) and `billing.test.ts`.


## PayPal website integration — November 1, 2026

The payment helper tests cover authenticated provider/configuration reads, deferred billing dates, server-owned checkout bodies, stale price/terms rejection, separate live/sandbox URL allowlists, approval versus settlement, and account-scoped pending checkout storage. Updated browser scenarios cover PayPal agreement, return verification and cancellation in addition to existing Stripe fixtures. The full Playwright suite is a separate command; see the payment release report for checks actually executed.

Browser QA for this integration uses the local mock API, not PayPal settlement. Real customer approval, a first charge and production cancellation require a controlled merchant test; no real charge is made by frontend QA.
