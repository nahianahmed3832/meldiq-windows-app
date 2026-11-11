# Meldiq website content map

All original public routes retained. Public page titles, descriptions, canonical URLs and social metadata are supplied by the shared layout.

| Route | Content | Primary destinations |
| --- | --- | --- |
| `/` | Hero, positioning, communities, private messages, privacy, calls, optional Mojo, device status, final CTA | Existing `/signup`; `/features`; `/pricing`; `/download`; privacy policy |
| `/features` | Community types/discovery, categories/channels/forums/threads, roles/permissions, direct/group messages, replies/reactions/mentions/edit/delete/read receipts, encrypted media/files, calls/video/screen sharing, security/session tools, moderation | Existing registration, privacy/acceptable-use policies |
| `/pricing` | Free, live active offers or useful Go/Plus previews, current configured comparison, Sparks, gifts, current trial/referral details, renewal/cancellation | Existing choose/checkout integration only for actual offers; `/account/billing`; `/signup`; Mojo terms |
| `/download` | Web, Android official Play listing/badge, supported browsers, planned iPhone/iPad/macOS/Windows | `https://web.meldiq.app/`; official Google Play URL |
| `/faq` | 31 answers in General, Communities, Privacy, Platforms, Subscriptions, Sparks, Gifts, Account; combined text/category filters and empty-state reset | Support, download, billing, registration, privacy and deletion information |
| `/support` | Recovery, billing, community moderation, privacy/data rights, abuse reporting, deletion and verified-contact handling | Existing `/forgot-password`; `/account/billing`; relevant help/policy routes; configured email only |
| `/legal/terms` | Existing substantive Terms of Service | Existing contents/related links retained |
| `/legal/privacy` | Existing substantive Privacy Policy and metadata/rights information | Existing contents/related links retained |
| `/legal/billing` | Existing renewal, trial, cancellation, refund and device terms | Existing billing page and related policies |
| `/legal/acceptable-use` | Existing community standards and reporting rules | Existing contents/related links retained |
| `/legal/account-deletion` | Existing deletion and data retention explanation | Existing billing/privacy links retained |

## Existing systems retained

`/login`, `/signup`, `/verify-email`, `/forgot-password`, `/account`, `/account/billing` and existing query-driven redirects are preserved. The actual messaging app remains at `https://web.meldiq.app/`. No separate registration, support-ticket backend or payment system is created.

## Sources of truth

`useCatalog()` → `/v2/billing/plans` controls sold prices, billing intervals and trials. `useMojoCatalog()` → `/v2/mojo/catalog` controls configured benefits, comparison values, Spark levels and gift status. `useOperator()` → `/v2/site/details` controls verified contacts and legal details. Public configuration is read on the same origin using the original validated API client. Failed lookups show uncertainty, not an invented “closed” or “active” status.

No planned native platform, bot allowance, security certification or independent audit is presented as available. The conflicting historical announced prices are documented in the audit, not sold to visitors. Analytics and consent behavior are unchanged; no new tracker was added.
