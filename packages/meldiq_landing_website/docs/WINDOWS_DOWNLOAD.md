# Windows desktop download

The Windows card, device-aware download target and platform availability copy use `src/lib/windowsDownload.ts`. It must identify the exact qualified immutable artifact: version, architecture, filename, byte length, SHA-256, source commit and public download/checksum/release-details paths. Never reuse a path for different installer bytes.

Windows 0.2.0 enables updates authenticated with Meldiq's pinned Ed25519 release key. Updates download automatically and install on a safe application exit. The installer has no Authenticode publisher certificate; the download page explains this in its release details. Version 0.1.0 users need one manual install to enable this updater. Complete backend/hardware acceptance is recorded separately in the desktop repository.

nginx serves immutable `/downloads/windows/` assets from `/opt/meldiq-desktop/downloads/windows/`, outside the static website release tree. Signed `/desktop-updates/` metadata comes from `/opt/meldiq-desktop/updates/` with `Cache-Control: no-store`. The signer and publication/qualification scripts are in the `meldiq-windows-app` repository. No signing key, account secret or backend credential belongs in this website. Public assets and the signed stable envelope must be verified before deploying a page that links them.

Validate with `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`, `npm run build` and `npm run e2e`. Review desktop/phone layouts. Deploy through `deploy/deploy.sh`, setting `MELDIQ_EXPECTED_SITE_CURRENT` to the reviewed current release path. The script shares the production release lock, refuses a changed baseline, preserves previous immutable Next.js chunks and restores the previous website if activation fails. A held production lock must be allowed to finish; do not kill its holder or bypass it.

Verify the live `/download` page, exact public installer/checksum/details links and signed stable feed after deployment. The desktop repository's `scripts/verify-live-private-release.mjs` authenticates the feed with the actual client verifier and downloads/verifies the complete installer against both signed digests.

This working directory is `/Volumes/code_files/meldiq_landing_website`. Its reviewed source is preserved in GitHub under `meldiq-windows-app/packages/meldiq_landing_website`. Keep those source copies synchronized when changing this integration; generated `out`, dependencies, test results and local environment files are excluded.
