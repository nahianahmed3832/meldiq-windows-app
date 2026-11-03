# Architecture

## Pages

| Path | Rendered | What |
|---|---|---|
| `/`, `/features`, `/download`, `/faq`, `/support` | build time | Product pages. Claims checked against `meldiq_android/docs` (FEATURE_INVENTORY, SECURITY) |
| `/pricing` | build time + browser | Free, Mojo Go, Mojo Plus. Plans on sale come from `GET /v2/billing/plans`; while it lists none, the owner-approved prices ($0.99 / $3.99 a month) show as "not on sale yet" (`src/lib/site.ts › ANNOUNCED_PLANS`) |
| `/signup`, `/verify-email`, `/login`, `/forgot-password` | browser | The account API (`/v2/auth/…`), the same accounts as every app |
| `/account`, `/account/billing` | browser | `GET /v2/billing/entitlements`, `/v2/billing/account`, checkout, portal, sync |
| `/legal/*` | build time | Terms, Privacy, Meldiq Mojo terms, Acceptable use, Account deletion. Drafts: not reviewed legal advice; unconfirmed details are visible placeholders |

## What operators control (no website release needed)

Since API 0.58.0 the owner's team changes these in the Platform Admin Console (admin.meldiq.app › Subscriptions &
Billing), and the site follows on the next page load:

| Console | API the site reads | Where it shows |
|---|---|---|
| Trials & invites: on/off, start, plan, trial days, invite days, yearly cap | `GET /v2/billing/plans` › `trial` (null while off) | hero pill (home, pricing, sign-up), "Free days" steps (home, pricing), FAQ answers, legal "Right now" line, invite banner on sign-up, welcome message, account days-left bar |
| Meldiq Mojo: limits per plan and Spark level, enforcement | `GET /v2/mojo/catalog` | pricing comparison table and Spark levels, home tier cards, FAQ "What is Meldiq Spark?" |
| Settings › Legal & business details (API 0.60.0): operator, address, contacts, refund window and rules, grace period, minimum age, privacy details, "last updated" | `GET /v2/site/details` (null: not decided) | every legal page, support page; undecided values stay "to be confirmed" placeholders (`src/lib/details.ts`) |
| Free days for one person, ended early | `GET /v2/billing/entitlements` › `personal.trial` (`operator`) | account page |

No number of days or limit is written in the site's code (`src/lib/catalog.ts`, `src/components/Mojo.tsx`,
`src/components/MojoCompare.tsx`); the legal page says the numbers are those on the pricing page when a free period is
given. Browser tests cover both "free days on" and "off" (`e2e/site.spec.ts`).

## Sessions

Sign-in is `POST /v2/auth/login` with the device name "Meldiq website": an account session with no device, which can
use the account and billing API but not messages. Tokens live in this tab's `sessionStorage` (`src/lib/session.ts`):
closing the tab signs the site out; the 15-minute access token is renewed with the refresh token (one renewal at a
time, because the refresh token rotates); signing out also ends the session on the server. The sign-up password is
held in memory only between sign-up and the verification step. The CSP allows no third-party script, which is what
keeps page script from being an exfiltration path.

## Buying Meldiq Mojo

1. Pricing shows Free and Mojo Plus at $3.99 USD/month. The actual 1 GB tier is 1,024,000,000 bytes in the shared API. Retired plans, mismatched prices and upload limits cannot open checkout.
2. The signed-in review dialog reads `/v2/billing/account`, `/v2/billing/entitlements` and `/v2/billing/paypal/config` before enabling agreement. It shows the actual provider, environment and first billing date, automatic renewal, cancellation, tax and failed-payment terms.
3. After agreement, the site revalidates those terms and calls `POST /v2/billing/checkout { planKey: "plus", returnTo: "site" }`. The API owns the merchant, price, account and PayPal subscription. The site follows only an HTTPS PayPal approval address for the configured live or sandbox environment. Existing Stripe checkout support remains for the Stripe provider.
4. Before navigating, the site retains the account id, internal checkout id, provider, mode, approval URL and expiry in sessionStorage. On `/account/billing?checkout=success`, it asks the authenticated `/v2/billing/paypal/checkouts/:id` endpoint to verify that account's checkout. A returned query, token, local flag or approval alone never grants access. Confirmed approval with a server-confirmed future billing date is displayed as scheduled, separately from a paid subscription. Without a retained checkout, `/v2/billing/sync` and the account summary remain authoritative.
5. Confirmation polls every six seconds for up to 45 seconds, then offers an explicit status retry. Canceled checkout returns show the billing state without claiming that a payment was made or undone. An unexpired retained checkout can be resumed from Billing, or its status checked again.
6. PayPal renewal cancellation uses `POST /v2/billing/paypal/cancel { confirm: true }` after an explicit confirmation step. The result is reloaded from the account summary. PayPal receipts remain in the customer's PayPal account; earlier Stripe subscriptions keep the provider portal where available.

This is a hosted redirect flow: no PayPal SDK script, secret, new CSP exception or browser-side payment capture is needed. Backend webhooks and PayPal REST verification retain authority over entitlement changes. Backend source and provider credentials are managed separately from this static website.

## One account, every device

The site reads the same `GET /v2/billing/entitlements` the apps will. A Mojo subscription belongs to the Meldiq account,
so signing in on Android or the web app (and later iOS, macOS, Windows) gives the same answer; nobody pays twice. See
`meldiq_android/docs/BILLING.md › Entitlements API` for the contract and refresh rules.
