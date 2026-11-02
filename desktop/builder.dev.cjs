const config = require('./builder.cjs');
module.exports = { ...config, forceCodeSigning: false, publish: null,
  win: { ...config.win, publisherName: undefined, artifactName: 'Meldiq-Setup-${version}-${arch}-UNSIGNED-DEV.${ext}', signAndEditExecutable: false },
  mac: { ...config.mac, identity: null, hardenedRuntime: false },
};
