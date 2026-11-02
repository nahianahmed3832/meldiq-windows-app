# Meldiq Desktop

Locally packaged Meldiq client for Windows x64, built with Electron, React and TypeScript. Owned and authored by MD.NAHIAN AHMED. Repository: [nahianahmed3832/meldiq-windows-app](https://github.com/nahianahmed3832/meldiq-windows-app).

**Development preview. Not approved for stable release.** The existing client source is reused, including messaging, communities, media, encrypted calls, Plus/Spark/gifts, profiles and customization. Source inclusion does not certify authenticated desktop parity. Signing, live backend/provider verification, versioned upgrade/signed-update acceptance and physical hardware benchmarks remain required. Native Windows CI install/launch/uninstall passed; see the test report.

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

Output: `release/Meldiq-Setup-0.1.0-x64-UNSIGNED-DEV.exe`. GitHub Actions also builds this artifact without publishing it to stable. Development updates are disabled. This is a complete local installer, not a downloader or hosted website wrapper.

The renderer builds all application code and assets into `dist/renderer`; Electron serves those files from disk in an isolated session. Existing `/v1`, `/v2` and realtime services remain cloud-backed. There is no second account, messaging backend, storage bucket or billing system.

Open **Meldiq → Desktop settings** or **Ctrl+,** for automatic/economy performance, hardware acceleration, device tests, temporary cache clearing, tray/startup and update preferences. No RAM check blocks 4 GB devices. Proposed hardware requirements are not final until Windows measurements pass.

See [architecture audit](docs/desktop/ARCHITECTURE_AUDIT.md), [feature inventory](docs/desktop/WEB_FEATURE_INVENTORY.md), [parity matrix](docs/desktop/FEATURE_PARITY_MATRIX.md), [test report](docs/desktop/TEST_REPORT.md), [system requirements and benchmarks](docs/desktop/SYSTEM_REQUIREMENTS.md), and [build/release guide](docs/desktop/RELEASE_ARCHITECTURE.md). The source snapshot and documented adaptations are checked by `npm run verify:snapshot`.

The [private unsigned development preview](https://github.com/nahianahmed3832/meldiq-windows-app/releases/tag/untagged-40b1c6d04794c18430c8) contains the 117.58 MiB installer, checksums, build facts and native Windows install evidence. It is a draft; production signing, complete feature acceptance, versioned upgrades and physical hardware benchmarks remain pending. See [the implementation report](docs/desktop/IMPLEMENTATION_REPORT.md).
