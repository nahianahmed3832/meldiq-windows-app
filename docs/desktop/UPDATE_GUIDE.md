# Automatic updates

The direct Windows distribution uses electron-updater and full NSIS installers. Unsigned development builds and future Store-managed MSIX builds disable it. The proposed CDN endpoints are not provisioned by this task.

Desktop settings offers automatic installation on safe exit, automatic download with explicit restart approval (default), and fully manual checks/downloads. Automatic checks occur after startup and every six hours. Failures are visible and manual retry is available. Downloads expose progress. Stable is default; beta and internal/canary are opt-in and must contain no credentials. Public canary artifact access is not a secret-management mechanism.

The existing shared call/attachment/transfer holds report busy state to main. Main separately counts native downloads and the capture picker, treats renderer navigation/crash as busy, and checks again after signature verification before installation. No forced restart during a call or critical transfer. Existing session data survives updates.

Signature verification is mandatory in production builder config. In addition to electron-updater checks, desktop verifies every downloaded EXE with Windows Authenticode and the approved certificate common name, rejects missing PowerShell/timeouts/malformed results/catalog signatures, and checks again before installation. A missing publisher cannot turn verification off. The update manifest SHA-512 and TLS do not replace signatures.

Publish immutable EXE and blockmap first; verify them from CDN; publish latest.yml, beta.yml or canary.yml last. Metadata cache must revalidate. electron-updater supports staged rollout metadata (`stagingPercentage`); start with a recorded limited percentage and raise only after acceptance. Keep previous versioned binaries. Halt a rollout by stopping metadata promotion/reducing staging percentage; ship a higher corrective version. Do not downgrade or reuse versions.

Signed update, interruption/retry, no-restart-during-call, publisher mismatch, offline verification, and data preservation need actual Windows integration acceptance. No successful live update is claimed.
