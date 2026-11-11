# Secondary public-page redesign — 12 November 2026

The production release redesigns the 30 secondary routes of `meldiq.app`. The approved homepage is preserved: **all 20 controlled live-baseline/candidate image comparisons have zero changed pixels**, and captured links, theme changes, FAQ and mobile-menu interactions are identical.

Status: **deployed and live-verified** from [5c3661a](https://github.com/nahianahmed3832/meldiq-windows-app/commit/5c3661aa74a2a55bf0cd68cb0631aaf9814af782), on branch `codex/public-pages-redesign-20261112`. Release `site-20261112-public-pages-6a4cbee84f` activated at **2026-11-11 18:33:45 UTC** (12 November, 02:33 in Shanghai). See [release.json](release.json) for artifact and delivery identifiers. No rollback was needed.

## Source and scope

- Repository: [nahianahmed3832/meldiq-windows-app](https://github.com/nahianahmed3832/meldiq-windows-app), package `packages/meldiq_landing_website`.
- Release branch: `codex/public-pages-redesign-20261112`. Website mirror base: `4f1e16cec8d5db19af7525e7aab1e4a351db6726`.
- Preserved current source: `a51599686769a8fb60d0b2bb20ecf858e04f4b98`. The active standalone website folder had no Git metadata and was newer than its repository mirror. This separate commit records that existing source before the design changes. Its homepage rendered identically to production.
- Work was isolated from the original website folder and the Windows checkout's unrelated native edits. No native, API, web-app, central-admin or status-service source is changed by the task commits.
- Next.js 16.3.8, Pages Router, static export. Relevant installed framework guides and `AGENTS.md` were read before implementation. Package versions and lockfile are unchanged.
- New styling is scoped to `.interior-site`, assigned only when the route is not `/`. The existing palette, Funnel Display/Poppins typography, navigation, footer and assets remain the design reference. Existing source formatting failures were corrected; whitespace-only legal and homepage-style changes are covered by rendered-content and pixel comparisons.

## Route matrix

“Checked” means the final candidate was visually inspected, its route/metadata tested and its internal destinations checked. All secondary routes have full-page 375px and 1440px captures in both themes. The four priority routes additionally have 320px and 768px captures. Post-deployment browser checks also covered all routes, including the three existing app redirects. Payment, email and cancellation submissions use local fixtures only.

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

Full-resolution local evidence is preserved under `reports/public-pages-20261112/`: `before`, `after`, `home-live-before`, `home-candidate`, `routes-before`, `routes-after`, `routes-after-light`, `live-after`, `live-other-pages` and `home-live-after`. It is excluded from Git to avoid committing repetitive generated images and browser traces. Curated images and machine-readable results are committed here.

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

The initial browser pass had selector ambiguity with Next's route announcer, a clock race in an existing rotation test and the layout defects noted above. Selectors were scoped to main content, the test clock was installed before its pause target, and the all-route crawl was given a bounded 90-second budget. The full run passed without retries. After the final legal-callout color adjustment, 33 relevant legal, FAQ and theme checks passed on the final export. Payment, email, account and cancellation tests use the existing local fixtures: they do not prove provider settlement, device acceptance or real email delivery. Only English and the existing Spanish route are published; no RTL locale is advertised or added.

## Reproduce and release

From this package on Node 22 or later: `npm ci`, `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test:coverage`, `npm run build`, `npm run e2e -- --workers=2`. The two optional server-contract tests need the existing `meldiq_android/server` checkout as a sibling. No production credentials are needed to build. Optional GA4 configuration must match the existing deployment; no new analytics stream was configured.

GitHub rulesets are empty and main is not protected at verification. This repository has native-client workflows; a push to this website task branch does not deploy the public site. No native release workflow is run. Website delivery follows the existing manual release mechanism.

The legacy `deploy/deploy.sh` defaults to the former Hostinger host and must not be used against that default. The authenticated deployment inventory verified AWS account `914016532802`, Frankfurt instance `i-05aee65dfc8a5adb9`, CloudFront distribution `E1781B6HAWPYTY`, and the Docker edge `meldiq-prod-edge`. These were revalidated through the control plane and SSM before deployment. The established website release layout is `/opt/meldiq-site/releases/<release>` with `/opt/meldiq-site/current` switched atomically.

The release followed the existing SSM, private staging-bucket and atomic website-symlink mechanism. The reviewed host root is a symlink to `/opt/meldiq-phase6/staged/source/opt/meldiq-site`; `current` uses a relative target so the same path resolves inside the Docker bind mount. Both production and website locks were acquired, and the predecessor was checked before preparation and activation. All 117 exported files matched the pinned archive/manifest; 590 previous immutable assets were copied without overwriting new files. The prior release was retained. No nginx configuration, DNS, secrets, native release, app/admin file, container identity or start time changed.

CloudFront's existing default policy is `Managed-CachingDisabled` with all TTLs zero. The new HTML and hashed assets appeared without an invalidation. The site is served by the existing edge container; no restart or nginx reload was needed.

## Production verification and rollback

- Live pages: [Developers](https://meldiq.app/developers), [Download](https://meldiq.app/download), [Features](https://meldiq.app/features), [Meldiq Plus](https://meldiq.app/pricing).
- Deployed build: `TwM8anwvzj4naoXPoslGh`; SSM activation command `d7cd9ff9-e480-4852-b4bb-cca476d7c536` completed successfully.
- All 31 HTML routes identify that build. Sixteen priority-page browser views have no runtime errors, failed site responses or page overflow, and **all 16 PNGs exactly match the verified candidate**. Twenty-six remaining browser views pass, including the expected account/login redirects.
- The post-deployment homepage repeats all 20 baseline states with **zero changed pixels** and identical interaction/CTA records.
- Live Plus shows USD 4.99 monthly, 1 GB uploads and one included Spark. Its action reaches the existing app's `/settings/mojo` entry and displays the sign-in choices. No billing POST was submitted. Download metadata and the native installer's SHA-256 still match the pinned 0.3.3 release.
- A browser opened before deployment continued navigating with the previous assets without errors; an ordinary reload selected the new build. All 17 previously loaded JavaScript URLs still respond successfully.
- The SDK copy action copies the exact displayed code when the isolated browser permits clipboard access. A denied clipboard shows the manual-selection fallback. The initial capture sampled this asynchronous status too early; the focused permission tests verify both completed outcomes.
- Final origin verification confirms every exported file and unchanged hashes for the native download, web app, admin HTML and nginx configurations, plus unchanged service identities/start times.

Evidence: [activation receipt](evidence/production-activation.json), [origin verification](evidence/origin-final.json), [live browser results](evidence/live-browser.json), [other live routes](evidence/other-routes-live.json), [priority image equality](evidence/deployed-priority-comparison.json), [live homepage comparison](evidence/homepage-live-comparison.json), [returning session](evidence/returning-session.json), [actual sign-in and denied-copy states](evidence/live-actions.json), [allowed clipboard](evidence/live-clipboard.json), [versioned private staging objects](evidence/staged-artifacts.json).

The preserved rollback target is `releases/site-20261108T131835Z-73277418b2`, original Next build `xynF_IcvjTerwr2bmD5m_`, homepage SHA-256 `c4a9cc287c5151f74641092494f2e0b67b42c0af4e79057b7c98db852d5b6be6`. The dated [controller](../../deploy/aws-public-pages-20261112/release.py) supports guarded rollback through the same locks and refuses a newer concurrent website release. From this package, an authorized operator can run:

```bash
python3 deploy/aws-public-pages-20261112/run-ssm.py rollback
```

The [SSM runner](../../deploy/aws-public-pages-20261112/run-ssm.py) uses the existing `griipbuddy` CLI profile and verifies the account/instance before submitting the controller. It records the command and result under `reports/public-pages-20261112/deployment/`. Rollback was prepared, not exercised against live visitors, because this release passed verification.

AWS access was renewed with the owner's explicit approval before deployment. No access blocker remains. The genuinely limited checks are the nine unconfigured optional GA4 tests, two existing Discord references returning 403 to automated HEAD, and real payment/device/email acceptance outside this website task. No production purchase, refund, account mutation, or native release was performed.
