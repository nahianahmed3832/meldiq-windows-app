// The production-readiness request requires a verified Windows publisher signature.
// Ed25519 updater metadata authenticates updates but does not satisfy Authenticode signing.
// Historical 0.2.x installers/feeds are untouched. Use package:win and desktop-release.yml for a new release.
throw new Error('Unsigned private-update publication is disabled. Build and verify a publisher-signed installer with the production acceptance gates before publication.');
