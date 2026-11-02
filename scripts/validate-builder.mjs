import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { validateConfiguration } = require('app-builder-lib/out/util/config/config');
for (const config of ['../desktop/builder.cjs', '../desktop/builder.dev.cjs']) await validateConfiguration(require(config), null);
console.log('Production and development builder configurations match the installed electron-builder schema.');
