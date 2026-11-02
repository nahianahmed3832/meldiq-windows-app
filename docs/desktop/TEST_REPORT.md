# Test report — 2026-11-03

Host: macOS/Darwin arm64, Apple M1, 8 GB RAM, 8 logical CPUs. This report does not certify Windows hardware or installation behavior.

| Check | Result |
|---|---|
| Shared web unit suite | 134 files passed; 924 tests passed, 2 skipped |
| Desktop policy/signature tests | 45 passed |
| Desktop + shared TypeScript | Passed |
| Desktop lint | Passed |
| Renderer/main/preload production build | Passed |
| Package inspection | 62 local assets; no remote application scripts, service-worker shell or source maps |
| Upstream snapshot verification | 1,722 original files checked; 8 existing files adapted; one bridge type file added |
| Real Electron offline smoke on macOS | Passed: sign-in UI with network blocked, isolation, untrusted IPC rejection, cache preservation, economy effects, native settings |
| Windows CI/package | Pending run; update after actual outcome |
| Physical Windows install/upgrade/uninstall | Not tested |
| Isolated real-backend desktop authentication/messaging | Passed email/password, device/encryption enrollment, OS-sealed reload restoration and bidirectional reference-client messaging on macOS; media/calls/payments pending |
| Signed automatic update integration | Not tested; no signing certificate/CDN provisioned |
| Low/mid/high physical Windows benchmarks | Not tested |

One narrow development measurement: signed-out shell startup 729 ms (single warm filesystem run including Playwright overhead), 30-second signed-out aggregate process working set 158.30 MiB (Browser 62.23, GPU 21.38, Utility 13.94, Tab 60.75 MiB). Sampled CPU was zero in that one idle snapshot. These are host observations, not a memory ceiling, Windows result, cold-launch result or sustained CPU guarantee. Files/messaging/video/screen-share and long sessions were unmeasured. Raw JSON is preserved under docs/desktop/evidence. Do not publish final requirements from this sample.

Real backend acceptance uses the existing media-release server source at commit b34d3ee82eeb82cdcce8d2e5af0ad06ead17398d, an isolated disposable SQLite database and file mailer, with no production credentials. The billing promotions preference endpoint returns 404 in that checkout; it is an observed compatibility issue, not a completed subscription acceptance. Earlier tests against older local backend builds exposed missing endpoint differences. Session restoration tests found and fixed both the persistent-key allowlist and legacy cleanup omission of desktopSealedTokens. A regression test now covers cleanup and database reopen. See evidence/integration.json.

The first Windows CI run found a source-test identifier using backslashes; the helper now normalizes it to slashes. Snapshot hashes also require LF checkout, enforced with .gitattributes. No test was disabled. Subsequent Windows CI evidence is recorded below.

The first deep-link test found URL normalization accepting an encoded dot segment; validation now rejects it before parsing. The first smoke run exposed an ambiguous accessible select label; the performance selector now has an explicit label. Both were corrected and the relevant checks rerun.

Dependency audit initially: 29 findings, including 4 high from a Firebase Firestore gRPC path unused by this renderer. Root-only runtime is electron-updater; inspect actual packaged node_modules and bundle before evaluating exposure. Full audit remediation is still a release gate. Do not force incompatible dependency downgrades suggested by npm audit. Current audit output is retained in evidence when finalized.

No failing test was hidden. The two shared skips belong to the inherited suite; inspect their source before release. Feature parity is unverified, so no percentage is asserted.

A macOS cross-package successfully produced the Windows x64 unpacked application. ASAR inspection passed (334 entries), with no Next/Firebase/gRPC runtime dependencies, source maps or secret-file extensions. NSIS execution on this arm64 host failed with macOS architecture error -86 for the builder's x64 makensis; no installer or Windows installation success is claimed from that attempt. Windows CI is the native packaging/installation route. The builder signing option was corrected to win.signtoolOptions.publisherName for the installed 26.18 schema; both configs now validate before every build.
