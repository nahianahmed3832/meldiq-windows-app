# Meldiq website audit

Audited November 1, 2026 (Asia/Shanghai). Scope: public marketing website only.

## Source and deployment

The existing project is `/Volumes/code_files/meldiq_landing_website`. It is a Next.js 16.3.8 Pages Router project with React 19, TypeScript, zod, global CSS, local Plus Jakarta Sans, original Meldling PNGs, static export to `out/`, and nginx deployment scripts. It has no Git metadata in this checkout. A source backup was made before editing. The existing account and billing pages call the same-origin `/v2` API; those integrations are retained.

No messaging application, Android code, database, backend, authentication implementation, Stripe integration or live deployment was modified.

## Existing public routes

All 11 requested public routes returned HTTP 200: `/`, `/features`, `/pricing`, `/download`, `/faq`, `/support`, `/legal/terms`, `/legal/privacy`, `/legal/billing`, `/legal/acceptable-use`, `/legal/account-deletion`. Account, registration, sign-in, password recovery and billing URLs are preserved. There was no verified hard 404 among the inspected public links.

## Findings and disposition

| Finding | Evidence | Result |
| --- | --- | --- |
| Existing visual system uses deep teal/cream and repeated text cards | Source stylesheet and desktop inspection | New scoped charcoal/cyan/lilac system, editorial sections, original mascot, community and call illustrations |
| Pricing depends on browser-loaded configuration | Initial HTML contains only Free and a loading state | Paid cards have useful non-purchase fallback content; actual sold offers still come from the existing billing hook |
| Announced and configured prices disagree | Existing homepage/constants announce $0.99/$3.99; current catalog list prices are $1.99/$4.99 | Stale announced prices are not advertised as purchasable. Active offers supply exact prices when sales open |
| Paid Mojo and Spark are not on sale | Billing `available:false`, no plans; catalog `onSale` values null, gifts false | Explicit availability status, no invented checkout or payment buttons |
| Configured limits are not enforced | Catalog `enforced:false` | Comparison and Spark values labelled configured previews |
| Historical specifications are outdated | Current message limits 2,000/4,000/8,000; uploads 50 MB/500 MB/2 GB | Public comparison reads current catalog, not the planning prompt |
| Bot values exist in configuration but bots are not implemented | Existing `MojoCompare.tsx` explicitly documents this | Bot allowances excluded from marketing |
| FAQ initial HTML includes “Checking what’s on offer…” | Live FAQ HTML | Replaced with 31 searchable/categorized questions, native accessible details, useful unknown-service answers |
| Support email is a placeholder | Live support and public details endpoint return no support/privacy email | No invented contact; truthful missing-contact message, help links, and dynamic verified address when configured |
| Legal drafts contain unresolved operator/policy fields | All five existing legal documents and public details endpoint | Substantive legal text preserved byte-for-byte; readable layout and existing tables of contents retained |
| SEO foundations already exist | Canonicals, titles, descriptions, sitemap, robots and OG image in source | Preserved and improved with absolute OG/Twitter images, per-page card metadata, dark theme and CSP-compatible WebSite microdata |
| Original responsive quality and field performance were not established | One desktop visual audit; no prior measurement baseline | Final redesign checked at five widths; local Lighthouse run recorded separately |

## Verified product facts

Read-only sources: [Features](https://meldiq.app/features), [Download](https://meldiq.app/download), [Privacy Policy](https://meldiq.app/legal/privacy), [Billing terms](https://meldiq.app/legal/billing), [Mojo catalog](https://meldiq.app/v2/mojo/catalog), [Billing plans](https://meldiq.app/v2/billing/plans), [Site details](https://meldiq.app/v2/site/details). Configuration snapshots were retrieved November 1, 2026; values can change.

- Web and Android available. The official Android listing is `https://play.google.com/store/apps/details?id=com.meldiq.android`; iOS/iPadOS, macOS and Windows are planned without confirmed release dates.
- Every core messaging feature is free; paid extras are optional.
- Current catalog version: `2026-10-30.1`. Spark levels are configured at 2/5/8 Sparks, with 100/200/500 emoji slots, 50 MB/200 MB/2 GB community uploads, 128/256/384 kbps voice, and 720p30 / 1080p60 / 1080p60-or-1440p30 screen presets. These are previews while not enforced and not sold.
- Encryption claims are attributed to the existing product architecture: messages and files are encrypted on devices, call-media encryption is on by default, metadata remains visible, and no independent security audit is claimed. No cryptographic audit was performed in this website task.
- Public billing configuration currently includes a 14-day Plus trial; trial/referral messages remain driven by the existing API hooks.

## Human decisions still required

Confirm final paid-plan pricing and benefits before opening sales. Publish support and privacy contact details in the existing admin console. Resolve the existing legal placeholders (registered address, governing law, minimum age, privacy legal bases/transfer safeguards, retention, failed-payment grace period and refund rules) and arrange legal review. Confirm Spark expiration/renewal terms before marketing paid Sparks. These are pre-existing business/content gaps, not a reason to invent values or change the backend.
