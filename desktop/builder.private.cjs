const base = require('./builder.cjs');
const config = require('../config/desktop.json');
const version = require('../package.json').version;
const lab = process.env.MELDIQ_UPDATE_LAB === '1';
module.exports = {
  ...base,
  appId: lab ? 'app.meldiq.desktop.update-lab' : base.appId,
  productName: lab ? 'Meldiq Update Lab' : base.productName,
  executableName: base.executableName,
  forceCodeSigning: false,
  win: { ...base.win, signtoolOptions: undefined, signExecutable: false, artifactName: (lab ? 'Meldiq-UpdateLab-' : 'Meldiq-Setup-') + version + '-x64.exe' },
  publish: [{ provider: 'generic', url: config.updateOrigin + '/windows/' + (process.env.BUILD_CHANNEL || 'stable') + '/' }],
};
