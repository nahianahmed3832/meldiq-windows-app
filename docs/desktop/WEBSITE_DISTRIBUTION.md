# Distributing Meldiq from the website

The owner's chosen distribution channel is the Meldiq website. No Authenticode certificate or dedicated physical Windows/Android test devices are currently available. Website hosting and Windows publisher signing are separate tasks; a website TLS certificate does not sign an EXE.

The existing landing source at `/Volumes/code_files/meldiq_landing_website` has `/download`, a Windows coming-soon card, and a null Windows download target in `src/lib/device.ts`. That public entry should stay truthful until a specific installer is approved and hosted. No landing source, public link, DNS, AWS resource or production web deployment was changed by this desktop task.

## Prepared preview handoff

The preserved Windows preview is **unsigned development software for internal testing**, with automatic updates disabled. It is not a public beta or production acceptance result. Stage that exact already-tested binary without rebuilding it:

```sh
npm run prepare:website-preview -- --installer '/Volumes/code_files/meldiq_windows/release/ci-490da68/release/Meldiq-Setup-0.1.0-x64-UNSIGNED-DEV.exe'
```

The script checks the original provenance hash/size and writes the EXE, checksum and truthful metadata into ignored `release/website-preview/`. `windows-preview.json` deliberately has `downloadUrl=null`, `published=false`, `signed=false` and `publicReleaseApproved=false`; there is no invented public artifact URL. The output is a concrete handoff for the website operator, not an upload or new release.

Before an authorized website publication, select the final artifact and intended audience, choose an actual existing storage path, retain immutable version/hash names, verify HTTPS downloads and content type/disposition, and link that exact artifact from the real `/download` page. Show release channel, version, architecture, installer size, signature status, checksum, measured/provisional requirements and release notes. Do not link a private draft GitHub URL as a public download, label an unsigned preview stable, or overwrite a tested installer with different bytes under the same release URL. Do not ask users to disable Windows security controls.

For a future signed release, use the signed final artifact and its new manifest; never reuse this unsigned preview's hash or provenance for it. Website download hosting can use approved existing infrastructure; it does not require creating an update CDN or enabling auto-update. Publication awaits applicable release gates and the owner's corresponding authorization.

## Obtaining publisher signing

1. Determine the real legal publisher identity and jurisdiction. The Git commit author is not automatically the certificate publisher, and `Meldiq` must not be guessed as the certificate Common Name.
2. Check current eligibility for Microsoft's [Azure Artifact Signing](https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart). It is a managed signing option with identity validation and CI integration. Eligibility depends on country and organization/individual status; check [Microsoft's current comparison](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options) before creating a paid resource. No subscription or resource has been created here.
3. If unavailable, obtain a publicly trusted code-signing service/certificate from an appropriate CA after its legal-identity and supported-country checks. Confirm the required hardware/cloud key custody and CI integration with the issuer. Do not buy an EV certificate solely on a promise of instant SmartScreen trust or try to export a non-exportable hardware key.
4. Once issued, record the exact validated publisher and actual signing service/profile/certificate setup privately. Use protected release approvals and the service's least-privilege CI credentials; permanent signing keys never enter the repository or renderer.
5. Integrate and test that actual signing method on Windows. The current release script's protected certificate-file path is a template, not a completed managed-service integration; managed/HSM signing requires its real implementation and reviewed preflight changes. Keep missing credentials fail closed rather than putting dummy values into certificate fields.
6. Validate signatures on all installer/application executables, install/upgrade/session retention, wrong-publisher rejection and signed update round trip before release. Signing does not itself certify functionality or guarantee that a newly distributed app has SmartScreen reputation. [Microsoft explains signing and reputation](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options).

No certificate purchase, identity application, signing-service provisioning or key upload has been performed. A self-signed test certificate would not replace trusted publisher signing for ordinary website users. The current preview remains unsigned and its update path remains disabled.

## Obtaining hardware evidence

Start with available internal/borrowed Windows laptops and a real Android or supported web peer with consent; record hardware/OS/graphics/driver, build hash and test operator. Required samples include 4 GB basic messaging without a hardware access gate, 8 GB dual-core integrated graphics, 16 GB i5/Ryzen 5 integrated graphics and a 16–32 GB higher-end system. Existing Windows CI supplies installer, shell and regression evidence, not physical performance acceptance.

Use `npm run benchmark` for its explicitly limited fresh-profile warm launch/30-second signed-out metrics. Complete cold launch, authenticated messaging latency, file integrity/throughput/cancel/retry, video/capture performance, CPU and aggregate process memory, device hotplug, sleep/wake and long-session runs separately with the authorized QA environment. Record actual measurements and failures, not estimates. A VM with restricted RAM can supplement testing but must be labeled virtual; it cannot establish physical low-end graphics, camera, thermal or battery behavior. No paid VM has been provisioned.

The full [readiness checklist](PRODUCTION_READINESS_CHECKLIST.md) and [production acceptance setup](PRODUCTION_ACCEPTANCE_SETUP.md) remain the release gates even when downloads are served by the website.
