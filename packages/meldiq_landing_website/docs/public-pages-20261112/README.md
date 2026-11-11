# Secondary public-page redesign — 12 November 2026

The release candidate redesigns the 30 secondary routes of `meldiq.app`. The approved homepage is preserved: **all 20 controlled live-baseline/candidate image comparisons have zero changed pixels**, and captured links, theme changes, FAQ and mobile-menu interactions are identical.

Status: implementation and independent verification complete, pushed as [5c3661a](https://github.com/nahianahmed3832/meldiq-windows-app/commit/5c3661aa74a2a55bf0cd68cb0631aaf9814af782); production activation awaits authenticated AWS access. This is not a deployment receipt. See [release.json](release.json) for the precise source, artifact and delivery state.

## Source and scope

- Repository: [nahianahmed3832/meldiq-windows-app](https://github.com/nahianahmed3832/meldiq-windows-app), package `packages/meldiq_landing_website`.
- Release branch: `codex/public-pages-redesign-20261112`. Website mirror base: `4f1e16cec8d5db19af7525e7aab1e4a351db6726`.
- Preserved current source: `a51599686769a8fb60d0b2bb20ecf858e04f4b98`. The active standalone website folder had no Git metadata and was newer than its repository mirror. This separate commit records that existing source before the design changes. Its homepage rendered identically to production.
- Work was isolated from the original website folder and the Windows checkout's unrelated native edits. No native, API, web-app, central-admin or status-service source is changed by the task commits.
- Next.js 16.3.8, Pages Router, static export. Relevant installed framework guides and `AGENTS.md` were read before implementation. Package versions and lockfile are unchanged.
- New styling is scoped to `.interior-site`, assigned only when the route is not `/`. The existing palette, Funnel Display/Poppins typography, navigation, footer and assets remain the design reference. Existing source formatting failures were corrected; whitespace-only legal and homepage-style changes are covered by rendered-content and pixel comparisons.

## Route matrix

“Checked” means the final candidate was visually inspected, its route/metadata tested and its internal destinations checked. All secondary routes have full-page 375px and 1440px captures in both themes. The four priority routes additionally have 320px and 768px captures. This does not imply production activation or a real payment/email submission.

| Route | Previous issue and purpose | Treatment | Functional verification |
|---|---|---|---|
| `/` | Approved reference | Preserve full design and behavior | 20 zero-pixel comparisons; theme, menu, FAQ and CTA records identical |
| `/developers` | Competing setup links; developer starting point | One primary settings action, process diagram, indexed guide, real SDK example | SDK ZIP/guide and settings resolve; anchors, collapse, copy and denied-copy fallback pass |
| `/download` | Download decisions buried in generic sections | Compact desktop/mobile/web cards, conservative suggestion, release details, setup and FAQ | Windows 0.3.3 x64 metadata/checksum unchanged; Android and web resolve; ARM/unknown use web; no automatic download |
| `/features` | Dense repeated lists; capability overview | Alternating product sections with existing labeled illustrative previews; separate privacy/security/moderation | Existing messaging and other anchors preserved; Free/Plus and platform links checked |
| `/pricing` | Premature unavailable copy; crowded product groups | Reserved neutral loading card, Free/Plus comparison, intervals together, separate community products | Pending, loaded, closed, error/retry, current benefits, legacy-offer gates and existing provider handoffs pass with fixtures |
| `/bots` | Generic hero/card hierarchy; bot overview | Compact product introduction and numbered content rows | Existing developer/permission destinations checked |
| `/community` | Repeated cards; community discovery | Readable product-guide rows and clear next step | Existing policy, support and app links checked |
| `/gaming-community-chat` | Wide copy and equal sections; community discovery | Product guide with deliberate reading width and supporting links | Links, headings and metadata checked |
| `/voice-video-screen-sharing` | Dense guidance; calling setup | Handbook with collapsible on-page index | Every index target exists; existing browser/call limitations retained |
| `/compare/discord` | Long equal blocks; product comparison | Indexed handbook | Existing disclosures retained; internal destinations pass; two external Discord pages reject automated HEAD with 403 |
| `/creators` | Oversized intro and crowded program content | Compact program hero, readable sections and balanced actions | Creator destination and existing program links resolve; no application submitted |
| `/partners` | Generic program grid; partnership explanation | Compact program layout with clearer section spacing | Existing partner/support destinations checked; no message sent |
| `/roadmap` | Status mixed into headings | Timeline with explicit Available/Planned labels derived from published text | Current platform links checked; no invented dates or unavailable download buttons |
| `/brand` | Assets lack visual emphasis | Dedicated asset gallery and prominent original PNG download | Existing PNG responds and download filename is preserved; usage wording retained |
| `/tutorials` | Long unstructured starter content | Handbook and on-page index | Setup anchors and app/help destinations checked |
| `/faq` | Oversized search introduction and cramped answers | Compact help layout, clearer filters and disclosures | Search/category intersection, empty-state reset and disclosure interaction pass |
| `/support` | Dense equal cards; route visitors to help | Smaller intro, readable help cards and contact section | Recovery, billing, privacy, abuse and status links checked; contacts not sent |
| `/security` | Long security explanation | Indexed trust handbook and privacy-policy action | Existing text/disclosures retained; no universal E2EE or certification claim added |
| `/es/chat-para-comunidades-gaming` | Long translated lines | Same product guide with localized navigation and actions | Spanish title/lang/canonical/alternate tags, long strings and narrow layout checked |
| `/legal/terms` | Wide legal text | Narrow reading column and existing document navigation | Entire normalized main text identical to baseline |
| `/legal/privacy` | Dense long policy | Readable document spacing and anchor offsets | Entire normalized main text identical to baseline |
| `/legal/billing` | Dense billing disclosure | Readable document template | Entire normalized main text identical; purchase/cancellation destinations retained |
| `/legal/acceptable-use` | Dense policy | Readable document template | Entire normalized main text identical; reporting anchor retained |
| `/legal/account-deletion` | Dense instructions | Readable document template | Entire normalized main text identical; billing-first instructions retained |
| `/account` | Public/auth presentation | Compact account layout; behavior preserved | Signed-out shared sign-in redirect; signed-in trial/referral fixtures pass; noindex retained |
| `/account/billing` | Dense account panels | Scoped account spacing; transactional logic preserved | Return verification, status and cancellation-confirmation fixtures pass; noindex retained |
| `/login` | Shared sign-in entry | Existing redirect retained | Billing intent and safe `next` destination pass; noindex retained |
| `/signup` | Oversized form heading | Compact, readable form presentation | Validation and sign-up/verification fixtures pass; no production account created |
| `/verify-email` | Form spacing | Compact auth template | Code flow and legacy address handling pass with fixtures; noindex retained |
| `/forgot-password` | Form spacing | Compact auth template | Reset/code flow passes with fixtures; no real email sent |
| `/404` | Generic error panel | Compact recovery presentation | Unknown URLs still return HTTP 404; home recovery link and noindex retained |

## Design evidence

Each pair shows the previous live design on the left and the verified candidate on the right. These are representative excerpts; the raw evidence retains full-page captures.

| Page | Desktop | Mobile |
|---|---|---|
| Developers | [Before/after](screenshots/developers-1440-before-after.webp) | [Before/after](screenshots/developers-375-before-after.webp) |
| Download | [Before/after](screenshots/download-1440-before-after.webp) | [Before/after](screenshots/download-375-before-after.webp) |
| Features | [Before/after](screenshots/features-1440-before-after.webp) | [Before/after](screenshots/features-375-before-after.webp) |
| Plus | [Before/after](screenshots/pricing-1440-before-after.webp) | [Before/after](screenshots/pricing-375-before-after.webp) |

Full-resolution local evidence is preserved under `reports/public-pages-20261112/`: `before`, `after`, `home-live-before`, `home-candidate`, `routes-before`, `routes-after` and `routes-after-light`. It is excluded from Git to avoid committing repetitive generated images and browser traces. Curated images and machine-readable results are committed here.

Homepage comparisons fix the clock to 12 November, reduce motion consistently, wait for fonts and substitute only the genuinely dynamic presence count with the same 12-user fixture. No structural regions are masked. Captures cover 320, 375, 768 and 1440px, dark/light themes, expanded FAQ and mobile menu. [Pixel results](evidence/homepage-comparison.json) · [interaction records](evidence/home-interactions.json).

Review exposed an inherited dark comparison-table background and low-contrast FAQ/legal-navigation text in light mode, plus small pricing-card growth after catalog resolution. These were corrected with interior-only styles; final captures, contrast measurements and delayed-catalog tests verify the fixes.

## Content and behavior sources

- Read-only production catalog snapshots: `https://meldiq.app/v2/billing/plans` and `/v2/mojo/catalog`. At verification, Plus is USD 4.99 monthly, one included Spark; community Bots+ is USD 3.99 monthly; an extra Spark is USD 2.99 once. Quarterly/yearly terms are configured but unavailable. The UI reads these sources and preserves existing purchase eligibility checks and plan identifiers.
- The former loading defect came from using “no matching offer yet” as “unavailable.” Both catalog requests must now resolve before sales status is presented. Failures have an explicit retry state. Benefits come from the raw catalog rather than a marketing helper that overwrote upload allowances. No billing/provider/business rules changed.
- Windows constants match the published immutable release JSON and checksum: 0.3.3, x64, 124,335,875 bytes, SHA-256 `fbfd5d377a17f2961322292f104fdce14083ce8a7677170a098b007e5a4f5243`. The installer remains unsigned by an Authenticode publisher; release-key update authentication is a separate property. Files and release feeds were not modified.
- The live SDK preview ZIP and README were downloaded and inspected. JavaScript/Python file names, bot identity example, environment variables, permissions and optional voice dependencies follow that guide. Private bot messages still require recipient approval.
- Existing security documentation was checked for encryption boundaries. Existing legal wording, dates and promises were preserved; all five rendered policy texts match the baseline. Historical provider names in existing policies were not rewritten as part of a design task.
- [External-link checks](evidence/external-links.json) cover the app, settings, SDK, native metadata/store and status destinations. Two existing Discord reference pages returned 403 to automated HEAD requests; no external-site availability claim is made for them.

## Validation

| Check | Final result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass |
| `npm run format:check` | Pass |
| `npm run build` | Pass; static export and 24 canonical sitemap pages |
| `npm run test:coverage` | 65 tests pass in 12 files, including the optional sibling-server contract checks |
| `npm run e2e -- --workers=2` | 222 pass across desktop Chromium, Pixel-sized Chromium and WebKit; 9 optional GA4 tests skipped because no measurement ID is configured |
| Final contrast regression | 33 legal, FAQ and theme checks pass after the final scoped success-callout color correction |
| Homepage | 20/20 controlled images identical; links and interactions identical |
| Priority responsive captures | 32 views, no browser page errors or page overflow |
| Other responsive captures | 104 views (26 routes × two widths × two themes), no browser page errors or page overflow |
| Legal content | 5/5 normalized main-text comparisons identical |
| Keyboard/contrast sampling | Visible skip-link focus in both themes; computed foreground/background checks pass on 20 routes in both themes, including expanded FAQ answers and every legal document; native disclosures/index and dialogs also exercised in browser tests |
| Initial asset budget | No new library or image assets. Gzip estimates increase by approximately 1.5–5.1 KB on priority routes and 3.0 KB on `/` from the shared interior stylesheet; no production speed improvement claimed |

Evidence: [build](evidence/build.txt), [unit/coverage](evidence/unit.txt), [browser run](evidence/e2e-final.txt), [final contrast regression](evidence/e2e-contrast-final.txt), [priority captures](evidence/priority-views.json), [other dark](evidence/other-routes-dark.json), [other light](evidence/other-routes-light.json), [content/keyboard/contrast](evidence/content-keyboard-contrast.json), [remaining contrast checks](evidence/remaining-contrast.json), [account fixtures](evidence/account-fixtures.json), [asset sizes](evidence/initial-asset-sizes.json).

The initial browser pass had selector ambiguity with Next's route announcer, a clock race in an existing rotation test and the layout defects noted above. Selectors were scoped to main content, the test clock was installed before its pause target, and the all-route crawl was given a bounded 90-second budget. The final full run passed without retries. Payment, email, account and cancellation tests use the existing local fixtures: they do not prove provider settlement, device acceptance or real email delivery. Only English and the existing Spanish route are published; no RTL locale is advertised or added.

## Reproduce and release

From this package on Node 22 or later: `npm ci`, `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test:coverage`, `npm run build`, `npm run e2e -- --workers=2`. The two optional server-contract tests need the existing `meldiq_android/server` checkout as a sibling. No production credentials are needed to build. Optional GA4 configuration must match the existing deployment; no new analytics stream was configured.

GitHub rulesets are empty and main is not protected at verification. This repository has native-client workflows; a push to this website task branch does not deploy the public site. No native release workflow is run. Website delivery follows the existing manual release mechanism.

The legacy `deploy/deploy.sh` defaults to the former Hostinger host and must not be used against that default. The current deployment inventory points to AWS account `914016532802`, Frankfurt instance `i-05aee65dfc8a5adb9`, CloudFront distribution `E1781B6HAWPYTY`, and the Docker edge `meldiq-prod-edge`. These must be revalidated with authenticated control-plane/SSM access before mutation. The established website release layout is `/opt/meldiq-site/releases/<release>` with `/opt/meldiq-site/current` switched atomically.

Release procedure: inspect and record the actual current symlink/build and previous artifact; acquire the production and website release locks; enforce an expected-current check; stage the exact validated export, retain previous immutable chunks for returning sessions and preserve the separate native-download tree; validate edge configuration; atomically activate; invalidate only affected CloudFront site paths if needed; verify ordinary/fresh sessions, routes, prices, links, errors and homepage images. Do not change DNS, secrets, other containers or production data. Rollback restores the recorded prior website symlink under the same locks and expected-current guard, then repeats live verification. The concrete rollback target must come from the live read, not historical notes.

At candidate verification the `griipbuddy` AWS session is expired. The separately configured `orbit-admin` identity is denied `ssm:DescribeInstanceInformation`; it was not used to bypass that access boundary. Production source/release identity, rollback target and post-deployment browser checks remain pending that access. No production deployment or rollback is claimed.
