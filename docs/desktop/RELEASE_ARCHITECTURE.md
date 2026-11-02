# Release architecture

Desktop version starts at 0.1.0 independently of the web 0.5.0-beta version. Build facts include commit, UTC timestamp, version, channel and distribution. Initial target: Windows x64, full standalone NSIS, per-user installation. No ia32 build; ARM64 requires future verified native dependencies and hardware tests. macOS/Linux configs are preparation only.

Development builds are unsigned and cannot auto-update. Signed releases require the actual Authenticode publisher subject and certificate in protected CI. A release must fail if these are absent; never turn off signature verification to publish stable. electron-updater verifies signed installers; SHA-512 metadata is not a replacement for Authenticode.

Proposed (not provisioned) CDN: https://updates.meldiq.app/windows/{stable,beta,canary}/. Immutable versioned installers and blockmaps; latest.yml/beta.yml/canary.yml metadata uploaded last with revalidation caching. No cloud writes in the client. Full NSIS, never nsis-web. Record signed installer hash and exact filename before promotion.

Automatic mode may install on safe app exit. Ask-before-restart downloads but waits for explicit installation. Manual checks/downloads only on request. Calls, capture, uploads and downloads block installation; renderer uncertainty also blocks installation. No forced restart. Stable default; beta/canary opt-in, no downgrade. A higher corrective version repairs a bad release; retain previous binaries and halt metadata promotion. Store MSIX bypasses the direct updater.

Source references checked 2026-11-03: https://www.electronjs.org/docs/latest/tutorial/security ; https://www.electronjs.org/docs/latest/api/protocol ; https://www.electron.build/auto-update ; https://www.electron.build/nsis . Registry resolves actual pinned dependency versions; release versions and advisories must be rechecked before shipping.
