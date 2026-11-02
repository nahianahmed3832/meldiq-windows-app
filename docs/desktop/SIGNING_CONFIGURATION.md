# Signing configuration template

No signing certificate is configured and no signed release is claimed. Configure the protected GitHub environment `desktop-release` with variables MELDIQ_SIGNING_PUBLISHER (actual certificate common name), MELDIQ_RELEASE_APPROVED=1 only after required acceptance, and secrets WINDOWS_CSC_LINK / WINDOWS_CSC_KEY_PASSWORD. Do not commit certificate/key material. Use an appropriate managed signing service integration instead when required by the issued certificate; configure and verify its actual build path before release.

Supply MELDIQ_RELEASE_ACCEPTANCE_JSON as independently reviewed evidence for the exact source commit. It is written to a git-ignored file at build time. Example schema (all flags are false until proven):

```json
{
  "commit": "<exact tested commit>",
  "featureParity": false,
  "windowsInstall": false,
  "windowsUpgrade": false,
  "signedUpdate": false,
  "hardwareBenchmarks": false,
  "backendCompatibility": false,
  "securityReview": false,
  "evidence": ["<reviewed immutable evidence URLs>"]
}
```

The Windows release workflow runs checks, forces signing, verifies every EXE Authenticode status and publisher, and generates checksums/build facts. Missing certificate, publisher, approval, evidence or a dirty source checkout blocks packaging. This workflow only creates a candidate. It does not publish stable or modify AWS.

For a known source commit: `gh workflow run desktop-release.yml -f channel=beta`. On a properly configured Windows shell use `npm ci` and `npm run package:win` with the same protected environment. Download the resulting candidate from that Actions run; complete install/upgrade/update acceptance before an authorized CDN promotion.
