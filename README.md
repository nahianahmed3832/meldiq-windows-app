# Meldiq Desktop

Locally packaged Meldiq client for Windows x64, built with Electron, React and TypeScript. Owned and authored by MD.NAHIAN AHMED. Repository: [nahianahmed3832/meldiq-windows-app](https://github.com/nahianahmed3832/meldiq-windows-app).

**Current remediation: 0.3.0-readiness.2.** Windows installer/protocol, browser handoff, permissions and localization work is tracked in the [readiness report](docs/desktop/WINDOWS_READINESS_REPORT.md). Production acceptance remains gated; the existing public release/feed has not been promoted by this work.

**Windows 0.2.0 has a qualified private-key updater.** Installed Windows tests passed automatic download/upgrade, corrupt-update rejection, busy guards and local fixture retention. The existing client source is reused, including messaging, communities, media, encrypted calls, Plus/Spark/gifts, profiles and customization. Complete authenticated desktop parity and physical hardware benchmarks remain pending. See [release-key distribution and operating instructions](docs/desktop/PRIVATE_UPDATE_RELEASE.md) and [native evidence](docs/desktop/evidence/private-update-0.2.0/README.md). Private update signatures do not provide Windows publisher signing.

Download Windows 0.2.0 from [meldiq.app/download](https://meldiq.app/download). The live signed feed and complete 124.2 MB public installer were authenticated after publication on 2026-11-03; see [the publication and integrity records](docs/desktop/evidence/private-update-0.2.0/README.md).

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run test:web
npm run build
npm run test:security
npm run test:smoke
npm start
```

Build an unsigned full Windows installer on Windows:

```sh
npm run package:win:dev
node scripts/release-manifest.mjs
```

Output uses the current version, for example `release/Meldiq-Setup-0.2.0-x64-UNSIGNED-DEV.exe`. Development updates are disabled. The separately qualified private-key distribution uses `Meldiq-Setup-0.2.0-x64.exe` and enables automatic updates. These are complete local installers.

The renderer builds all application code and assets into `dist/renderer`; Electron serves those files from disk in an isolated session. Existing `/v1`, `/v2` and realtime services remain cloud-backed. There is no second account, messaging backend, storage bucket or billing system.

Open **Meldiq → Desktop settings** or **Ctrl+,** for automatic/economy performance, hardware acceleration, device tests, temporary cache clearing, tray/startup and update preferences. No RAM check blocks 4 GB devices. Proposed hardware requirements are not final until Windows measurements pass.

See [architecture audit](docs/desktop/ARCHITECTURE_AUDIT.md), [feature inventory](docs/desktop/WEB_FEATURE_INVENTORY.md), [parity matrix](docs/desktop/FEATURE_PARITY_MATRIX.md), [test report](docs/desktop/TEST_REPORT.md), [system requirements and benchmarks](docs/desktop/SYSTEM_REQUIREMENTS.md), and [build/release guide](docs/desktop/RELEASE_ARCHITECTURE.md). The source snapshot and documented adaptations are checked by `npm run verify:snapshot`.

The original 0.1.0 [development preview](https://github.com/nahianahmed3832/meldiq-windows-app/releases) remains preserved as a draft with its original checksums and provenance. Users of that build need a one-time manual installation of 0.2.0 to enable the new updater. See [the implementation report](docs/desktop/IMPLEMENTATION_REPORT.md) for historical implementation evidence.

Production acceptance configuration, dedicated QA provisioning and remaining gates are documented in [the acceptance setup](docs/desktop/PRODUCTION_ACCEPTANCE_SETUP.md). The owner selected website distribution and locally protected Ed25519 release signing. The [landing website source](packages/meldiq_landing_website) is preserved here alongside the desktop app; the actual working site remains at `/Volumes/code_files/meldiq_landing_website`. Live publication evidence is recorded separately from build/qualification evidence.

The earlier [production validation report](docs/desktop/PRODUCTION_VALIDATION_REPORT.md) records regression, inventory, installer and public API/WSS checks. [Newer private-update evidence](docs/desktop/evidence/private-update-0.2.0/README.md) supersedes its update-specific blockers. Authenticated workflows, real media/calls, sandbox payments, Windows publisher signing and physical hardware acceptance remain pending.
