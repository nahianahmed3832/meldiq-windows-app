# Installation and development

Initial target: Windows x64 only. Download a signed approved production installer from meldiq.app/download when one is actually published. No signed production release currently exists from this work.

Development installers are named `Meldiq-Setup-0.1.0-x64-UNSIGNED-DEV.exe` and are available as private GitHub Actions artifacts after CI succeeds. They contain Electron, the built renderer and runtime dependencies; installation needs no second application download. They are unsigned previews with updates disabled.

Run the installer, choose the current-user destination and shortcut options, then launch Meldiq and sign in with the existing account. Per-user scope requires no elevation. Normal default destination is `%LOCALAPPDATA%\Programs\Meldiq`. Native account data is under the user's application-data directory, separate from binaries. Installer/uninstaller execution, registry ownership and installation failure recovery must be verified on Windows before release.

Upgrade by running a newer installer for the same app identity and scope. Never reuse a published version number. Back up evidence and verify account persistence across upgrade. Uninstall through Windows Installed apps; ordinary uninstall preserves local user data by configuration. Deliberate account removal belongs to Meldiq's existing logout/account workflows. Temporary cache clearing is not account deletion.

Build prerequisites: Node 22.12+ and npm, Git, network for dependency/runtime download. `npm ci`, `npm run build`, `npm start`. On Windows use `npm run package:win:dev`. Source checkout and release instructions are in README.md. The GitHub workflow is the reliable Windows packaging route from a macOS development machine.
