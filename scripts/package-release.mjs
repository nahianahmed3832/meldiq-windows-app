import { execFileSync } from 'node:child_process';
const env = { ...process.env, BUILD_DISTRIBUTION: 'direct' };
const run = (file, args) => execFileSync(file, args, { env, stdio: 'inherit' });
run(process.execPath, ['scripts/release-preflight.mjs']);
run(process.execPath, ['scripts/build.mjs']);
run(process.execPath, ['node_modules/electron-builder/cli.js', '--config', 'desktop/builder.cjs', '--win', 'nsis', '--x64', '--publish', 'never']);
run('pwsh', ['-NoProfile', '-NonInteractive', '-File', 'scripts/verify-windows-signatures.ps1']);
run(process.execPath, ['scripts/release-manifest.mjs']);
