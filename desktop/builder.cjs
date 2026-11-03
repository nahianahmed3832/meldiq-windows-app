const path = require('node:path');
module.exports = {
  appId: 'app.meldiq.desktop', productName: 'Meldiq', executableName: 'Meldiq',
  directories: { output: 'release', buildResources: 'desktop/resources' },
  files: ['dist/**/*', 'desktop/resources/icon.png', 'desktop/resources/icon.ico', 'package.json', '!**/*.map', '!**/test/**', '!**/.env*'],
  asar: true, compression: 'maximum', npmRebuild: false,
  forceCodeSigning: true,
  protocols: [{ name: 'Meldiq', schemes: ['meldiq'] }],
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }], icon: 'desktop/resources/icon.ico',
    requestedExecutionLevel: 'asInvoker', verifyUpdateCodeSignature: true,
    signtoolOptions: { publisherName: process.env.MELDIQ_SIGNING_PUBLISHER },
    artifactName: 'Meldiq-Setup-${version}-${arch}.${ext}',
  },
  nsis: { include: 'desktop/resources/installer.nsh', installerIcon: 'desktop/resources/icon.ico', uninstallerIcon: 'desktop/resources/icon.ico', installerHeaderIcon: 'desktop/resources/icon.ico', oneClick: false, perMachine: false, allowElevation: false, allowToChangeInstallationDirectory: true, createDesktopShortcut: true, createStartMenuShortcut: true, deleteAppDataOnUninstall: false, differentialPackage: true },
  publish: [{ provider: 'generic', url: `https://updates.meldiq.app/windows/${process.env.BUILD_CHANNEL || 'stable'}/`, channel: process.env.BUILD_CHANNEL === 'beta' ? 'beta' : process.env.BUILD_CHANNEL === 'canary' ? 'canary' : 'latest' }],
  mac: { target: ['dmg'], category: 'public.app-category.social-networking', hardenedRuntime: true, extendInfo: { NSCameraUsageDescription: 'Meldiq uses your camera during video calls.', NSMicrophoneUsageDescription: 'Meldiq uses your microphone during calls.' } },
  linux: { target: ['AppImage', 'deb'], category: 'Network' },
  afterPack: async context => {
    const { flipFuses, FuseVersion, FuseV1Options } = await import('@electron/fuses');
    const executable = context.electronPlatformName === 'darwin' ? path.join(context.appOutDir, 'Meldiq.app') : path.join(context.appOutDir, context.electronPlatformName === 'win32' ? 'Meldiq.exe' : 'Meldiq');
    await flipFuses(executable, { version: FuseVersion.V1, [FuseV1Options.RunAsNode]: false, [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false, [FuseV1Options.EnableNodeCliInspectArguments]: false, [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true, [FuseV1Options.OnlyLoadAppFromAsar]: true });
  },
};
