# Meldiq website release checklist

Prepared November 1, 2026. **Status: deployed to the existing Hostinger website on November 1, 2026. See MELDIQ_HOSTINGER_DEPLOYMENT.md for the release and verification record.**

## Completed preparation

- [x] Existing website source located and backed up before edits.
- [x] All 11 public routes redesigned/restyled with consistent shared header/footer.
- [x] Existing registration, account, billing and app destinations preserved.
- [x] Original authentication, API/session, account, legal documents and deployment implementation checked for unintended changes.
- [x] Existing legal substantive text retained; draft and unconfirmed details remain visible.
- [x] Paid offers, configured previews and planned platforms distinguished.
- [x] Official Android link/badge verified; no fake native downloads.
- [x] Searchable/categorized FAQ, responsive navigation and native accordions implemented.
- [x] Metadata, social artwork, robots/sitemap and CSP-safe structured data checked.
- [x] Build, types, lint, formatting and 32 unit tests passed.
- [x] Five-width responsive, public-link, asset and accessibility checks completed.
- [x] Lighthouse mobile scores recorded: 98/100/100/100.
- [x] Requested audit, design-system, content-map, QA and release documents saved.

## Before a production release

- [x] Owner requested publication to Hostinger; existing meldiq.app target verified and website-only deployment completed.
- [ ] Run the updated full browser matrix (`npm run e2e`) against the existing mock API; review actual Safari/WebKit and Android/iOS behavior where available.
- [x] Re-read live `/v2/billing/plans`, `/v2/mojo/catalog`, `/v2/site/details` immediately before launch. Active offers are displayed from those sources, not historical constants.
- [ ] Decide whether to release the visual redesign while the pre-existing legal drafts/contact gaps remain visible, or fill the missing details and obtain legal review first.
- [x] Confirm the existing nginx same-origin `/v2` proxy remains in place. Static hosting without that proxy cannot support the existing account/billing pages.
- [x] Rebuild the approved source immediately before release and retain its exact archive/hash.

## Existing target and release mechanism

The existing deployment documentation and `deploy/deploy.sh` identify `meldiq.app` and a VPS release tree at `/opt/meldiq-site`. The script defaults to `root@72.60.107.88` unless `MELDIQ_SITE_HOST` overrides it. This is repository configuration, not a new authorization or confirmation that credentials are currently available. No SSH credential inspection or live server write was performed.

After approval and final checks, use the existing documented website-only deployment workflow. Do not modify nginx, API deployment, messaging-web deployment, Android, database or Stripe as part of this redesign. No Sites project was registered and no hosting audience changed.

## Rollback

The existing release workflow stores versioned website directories and atomically switches `/opt/meldiq-site/current`. Record the current release before deployment, retain the previous website release, and use the existing `deploy/rollback.sh` workflow if post-release smoke checks fail. No schema changes or backend rollback is required by this change. The local source backup is retained in this chat’s working directory; the deliverable source archive includes the final reviewed website source and existing deployment scripts.

## Post-release smoke checks

Check every public route, `/signup`, `/login`, signed-out account redirects, correct app/Google Play destinations, mobile menu, FAQ search and filters, live pricing status, legal contents links, OG preview, security headers and the same-origin configuration endpoints. Inspect production logs and roll back the website release if material errors appear.
