# Windows private update qualification — 0.2.0

Public candidate source: `90175e1b21d17171f727a3895edad795f5f38150`. The actual installer is 124,227,227 bytes, SHA-256 `6e53a63f4953fa7a5650865deacf5e8a45b377d60fcfad1c08582486b9383313`.

- [Candidate build and regression run](https://github.com/nahianahmed3832/meldiq-windows-app/actions/runs/41585285792): passed typecheck, lint, 74 desktop tests, 924 web tests (two inherited skips), 1,722-file source snapshot verification and all three NSIS packages. `candidates.json` records exact artifact hashes and build identities.
- [Installed Windows qualification](https://github.com/nahianahmed3832/meldiq-windows-app/actions/runs/41586366656): passed the bad-signature, bad-hash and actual automatic upgrade scenarios. `windows-qualification.json` is the final proof printed only after the complete public install/launch/configuration/uninstall smoke check also passed. Windows CI reported `Microsoft Windows NT 10.0.26100.0`.
- `installed-public-asar.json` records inspection of the actual installed public candidate: private updates enabled, correct pinned release-key fingerprint and website feed, and no updater-lab control hooks.
- GitHub qualification artifact `13208306253`, 1,178 bytes, digest `sha256:56240e869a81c004912ba2c94c2ed85e67ec392ad10cd9519a6bc58182f17bb9`. Its original smoke report is preserved verbatim as `windows-install-original.json`. That legacy smoke report's generic pending upgrade/signing entries are superseded specifically by the additional private-key qualification proof; they do not negate the actual test, imply Authenticode signing or pass wider production acceptance.
- Website source is preserved at `packages/meldiq_landing_website`. `website-tests.json` and `website-layout.json` record type/lint/unit/browser/static-export validation and desktop/phone overflow/visual checks. Billing browser tests use a mock API; no real transaction occurred.

The first qualification attempt, run `41584112497`, failed because the isolated lab requested the stable channel while its signed fixture was canary. The lab channel was corrected, and negative tests were strengthened to require the precise cryptographic failure cause so a transport/404 failure cannot count as signature or hash rejection. All candidates were rebuilt from the corrected source; none of the first run's candidates was published as the stable release.

Fixture account/message/session retention proves installed local-data preservation. Authenticated production accounts, Android interoperability, S3, LiveKit, payments, Windows 10 and physical hardware benchmarks remain separate acceptance gates. The installer has no Windows publisher certificate.

## Live publication

Published **2026-11-03 06:19 UTC** at [meldiq.app/download](https://meldiq.app/download). `publication.json` records the immutable binary URL, exact size/hash, passing preparation/qualification run IDs and metadata-last promotion. `website-deployment.json` records atomic activation of the reviewed site baseline and retained previous chunks.

`live-integrity.json` records authentication of the actual public stable feed with the same verifier used by the client, an exact page link, correct immutable/no-store/download headers, and a complete HTTPS installer download checked against both signed digests. `live-browser.json` records real desktop/phone page rendering with release details visible, no horizontal overflow and no page errors. `stable-release-envelope.json` preserves the exact published signed metadata; signatures are public verification data, not private keys. Its current expiry is 2027-02-01 05:51:36 UTC.

Publication waited until the separate database operation released the shared lock. This task deployed only static website content and desktop assets/metadata on the existing host. No backend/database/payment credentials/DNS/AWS resources were changed. The original 0.1.0 installer remains preserved.
