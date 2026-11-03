# Windows 0.2.1 storage compatibility release

The 0.2.0 renderer blocked Frankfurt multipart uploads through its bundled content security policy. The 0.2.1 desktop main process discovers exact permitted HTTPS connection origins from the trusted Meldiq web deployment and preserves the local renderer's script and navigation restrictions.

The preparation run built the production installer and two isolated updater installers. The native qualification run checked corrupt artifact and signature rejection, automatic installation and the actual public candidate. The owner approved publication after qualification. The signed stable feed was promoted on 3 November 2026 at 07:24:06 UTC.

The complete public installer matched the signed metadata and qualified artifact. The checked download page links the immutable 0.2.1 URL. The private update signature is distinct from Windows Authenticode publishing.

[Preparation run](https://github.com/nahianahmed3832/meldiq-windows-app/actions/runs/41594164714) · [Native qualification](https://github.com/nahianahmed3832/meldiq-windows-app/actions/runs/41595294384)
