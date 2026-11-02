# Desktop implementation plan

1. Completed: audit accessible source and record repository metadata; enumerate all UI modules and routes.
2. Implement immutable reusable-client snapshot and locally built renderer, secure main/preload bridge, native lifecycle and storage.
3. Add adaptive modes (including 4 GB access), bounded temporary cache, device-loss handling and screen/window picker.
4. Add NSIS x64 development packaging, fail-closed signed release configuration and Windows CI.
5. Add updater channels/preferences, call/upload holds, progress and explicit install guard.
6. Run shared unit tests, desktop security/policy tests, type checks, build, actual Electron offline-launch integration and Windows CI packaging.
7. Remaining acceptance: authenticated feature matrix across web/Android/desktop; physical low/mid/high Windows machines; signed install/upgrade/update/uninstall. No stable publication until evidence is recorded.

No web/backend worktree, production infrastructure, account policy, pricing, entitlement, database or media bucket will be modified. Missing signing/infra credentials are documented; development artifacts stay explicitly unsigned and updates disabled.
