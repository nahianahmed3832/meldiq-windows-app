# Production validation report — 2026-11-03

**Decision: not ready for public beta or production.** The owner selected website distribution and confirmed there is no signing certificate or designated physical test hardware yet. No production customer data, payments, infrastructure, DNS or public website deployment was changed.

## Completed work

- Created [production acceptance setup](PRODUCTION_ACCEPTANCE_SETUP.md), a safe external environment example, and the [three-account provisioning checklist](QA_ACCOUNT_PROVISIONING.md). The real local file is owner-only, outside the repository, with credentials/IDs empty and QA authorization false. No account/community was provisioned.
- Added explicitly configured read-only discovery, real Electron public-contract/WebSocket probes, configuration isolation tests, and fail-closed setup checks. Existing isolated backend acceptance remains separate and cannot inherit production service secrets.
- Mapped all 387 UI modules into 32 workflow families with procedures, candidate-test associations, stage-specific evidence and blocked reasons. Zero unmapped modules does not mean complete feature parity. See [the matrix](FEATURE_PARITY_MATRIX.md).
- Resolved the empty desktop media connection list using three exact S3/LiveKit origins already allowed by the actual production website CSP. Read existing S3 CORS/lifecycle using the existing operator profile without changing policies or permissions.
- Reproduced and fixed an updater channel-switch race before preferences persist; added four regression tests. Tightened the release workflow to exact publisher/Authenticode checks, with native negative fixtures reproducing its former prefix-matching flaw. Pinned build actions to official release commit SHAs.
- Added actual renderer/worker module inventory and packaged ASAR dependency inspection. A native inspection-script separator failure was recorded and corrected without bypassing the matching-build assertion.
- Staged the preserved unsigned preview, checksum and truthful website metadata locally using `npm run prepare:website-preview`; no binary was rebuilt for that handoff or published. See [website distribution and signing/device acquisition](WEBSITE_DISTRIBUTION.md).

## Actual validation and limits

Local checks passed: 50 desktop tests, 924 shared web tests, three configuration-loader tests, lint, typechecks, all 1,722 upstream snapshot files, matrix checks, build, packaged-code secret/boundary checks and native offline smoke. Two inherited web tests remain skipped and are not counted as passes.

The existing real backend integration rerun passed email/password login, device/encryption enrollment, OS-sealed session reload and bidirectional messaging with a reference protocol peer using disposable loopback storage. This is not an actual Android/web peer, production account test, media call or payment test.

Native Windows run [41542736092](https://github.com/nahianahmed3832/meldiq-windows-app/actions/runs/41542736092) passed regressions, native signer-policy fixtures, shared checks, packaging, ASAR checks, silent install, visible app launch, uninstall, and actual Windows Electron public API/WSS probes. Final native run [41545082290](https://github.com/nahianahmed3832/meldiq-windows-app/actions/runs/41545082290) passed all steps for source `62166625c11a11a6e04d84237ef4cd8960a3a3b2`, including the required matched renderer/ASAR inventory, exact signer-policy fixtures, packaging, install/launch/uninstall and public API/WSS probes. [Permanent CI evidence](evidence/windows-ci-production-acceptance.json) and [artifact identity](evidence/windows-validation-artifact-6216662.json) are retained in the repository; complete new installer checksums/inventories remain in that Actions artifact. The new candidate is 124,222,631 bytes and remains unsigned, separate from the preserved preview. The failed intermediate inventory run is not represented as passing. Documentation-only evidence commits after this run do not change its binary or source provenance.

Production public checks confirm API 0.76.1, healthy Atlas/Redis, configured LiveKit, Google/Discord providers, live PayPal catalog, and an unauthenticated WSS handshake on both macOS and Windows Electron. They do not verify authenticated event delivery, QA entitlements or transactions.

The earlier 403 is classified as Cloudflare 1010 `browser_signature_banned` for default urllib; actual Electron passes without spoofing or changing hosts. The local promotions-preference 404 comes from the older isolated backend source; current production answers the protected endpoint with 401 when unauthenticated. Actual authenticated GET/PUT is still pending. See [backend compatibility](BACKEND_COMPATIBILITY_REPORT.md).

## Preview provenance

Original installer: `Meldiq-Setup-0.1.0-x64-UNSIGNED-DEV.exe`, 123,287,259 bytes, source commit `490da683ea29ea984055d3487e0c0ba0e3fc6375`, SHA-256 `9a8460e981d5df4e31ff3e93aef2e8b258083cf7340778c0d5f1b91ba7d8757c`. Its private draft release and byte identity are preserved. New CI candidates are separate artifacts; the original preview does not acquire later fixes by editing metadata. Website handoff metadata references the original exact binary, is unsigned/unpublished and has no invented download URL. Automatic updates stay disabled.

## Remaining release gates

- Dedicated actual A/B/C credentials, owner authorization, private QA object IDs and verification/key-unlock procedure. Production provisioning must use the existing authorized operator mechanism; no global admin roles or guessed account values.
- Full authenticated workflow acceptance and real Windows-to-Android/web interoperability. Existing reference-peer evidence does not pass this gate.
- Actual backend-authorized S3 transfers, plaintext integrity, wrong-account denial, cancellation/retry, quotas and verified cleanup. Configured CORS/retention is not proof of object behavior. Small identifiable production QA files only; large/quota/destructive cases require isolation.
- Actual LiveKit audio/video, room grant expiry, explicit screen sharing, output/camera/microphone switching and disconnection, reconnection/sleep/wake, capture/resource release and notification privacy.
- Isolated test/sandbox backend/provider configuration for Stripe/PayPal transactions and server-authoritative entitlement/webhook/gift/subscription transitions. Production remains live PayPal; no live financial action was executed.
- Security sign-off: fresh audit still has four high and 25 moderate findings. None of those named packages is in the inspected Node runtime; the renderer includes Firebase app/messaging while the vulnerable Firestore/gRPC path is absent. Build-tool and final Electron/Chromium review remain open; no blanket advisory waiver. See [security report](PRODUCTION_SECURITY_REPORT.md).
- Trusted signing identity/service, protected release environment, actual signed install/upgrade/session retention, signed update round trip and recovery, approved hosting/promotion authority. Website distribution does not supply publisher signing.
- Physical Windows 4 GB basic-use and 8/16/16–32 GB low/mid/high hardware measurements for cold/warm startup, idle RAM/CPU, messaging, files, calls, capture and long sessions. Current CI and the old Mac sample do not justify final published requirements.

The [readiness checklist](PRODUCTION_READINESS_CHECKLIST.md) records each gate. Missing infrastructure/account values remain explicitly identified; no URL, credential, endpoint or performance figure was invented to pass them.
