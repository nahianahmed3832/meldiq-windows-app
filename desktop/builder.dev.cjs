const config = require('./builder.cjs');
module.exports = { ...config, forceCodeSigning: false, publish: null,
  win: { ...config.win, signtoolOptions: undefined, artifactName: 'Meldiq-Setup-${version}-${arch}-UNSIGNED-DEV.${ext}', signExecutable: false },
  // Re-sign locally after packaging/fuse edits; retaining Electron's old signature
  // causes Apple silicon to terminate the bundle before startup. This is QA only.
  mac: { ...config.mac, identity: '-', hardenedRuntime: false, notarize: false },
};
