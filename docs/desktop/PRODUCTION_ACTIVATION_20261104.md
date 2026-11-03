# Production activation — 4 November 2026

**Monthly Plus sales and hosted desktop authentication returns are enabled. A new Windows production update has not been published. Full production acceptance is not complete.** Physical Windows testing is deferred at the owner's request; real provider consent, an approved buyer transaction, successful signed webhook delivery, entitlement activation and publisher signing are not reported as passed.

## Deployed changes

The current API was verified as `griip-internal-messaging-api:0.76.1-pg-b9e6f005`, image `sha256:9bb580a8be7a5f2823cd0b9a1ad95bed65291389321658d29124feebe321ba5c`, with Supabase/PostgreSQL and Redis healthy. The old Atlas deployment receipts were not used as the current authority. The web release remains `/opt/meldiq-web/releases/0.5.0-beta-public-status-c60e2bf`.

The approved live merchant configuration still referenced a USD 3.99 monthly Plus plan, while current backend terms require USD 4.99. The backend correctly omitted that mismatched offer. A separate active live plan, `P-49S40199EV0769032NLVBAQI`, was created for the existing product: USD 4.99, monthly, quantity one, no setup fee, no extra tax or trial cycle. Its terms were read back through PayPal and validated by the deployed adapter. The old USD 3.99 plan was read back unchanged; no price-update or subscription-revision API was called.

Only `PAYPAL_PLUS_PLAN_ID` changed in the existing private runtime environment. The same API image was recreated, preserving all other environment entries, data mounts, port/resource limits and database authority. The existing private operator command `billing-paypal-plus --term=monthly --publish` published the new immutable catalog version and recorded its operator audit entry using the running PostgreSQL writer. No direct SQL edit, schema change, user reset, forced entitlement or customer charge was performed.

The public catalog now reports Plus at **499 USD cents/month**, with monthly availability true. Quarterly and yearly subscription availability remain false. Sparks remain USD 0.99 and Bots+ USD 3.99. Existing Plus gift availability follows the existing gifts flag and is now true; promotional settings were not changed. Web and Windows consume this same catalog. The live website showed **$4.99/month** and an enabled **Choose Meldiq Plus** button; selecting it opened account/billing sign-in.

The browser handoff assets were deployed as an immutable overlay under `/opt/meldiq-desktop/hosted/auth-66f8b58ba98fb5b8`. Exact nginx locations serve the bridge, the social callback script and Discord return handler without replacing the current web application's compiled files. The Discord handler preserves the existing browser import return-storage contract. Callback access logs are disabled; assets return no-store, no-referrer and existing CSP/security headers. The trailing-slash Discord route redirects to the canonical callback while preserving its query. Capability version 1 is now served correctly instead of falling back to application HTML.

## Evidence and verification

Evidence is in [production-activation-20261104](evidence/production-activation-20261104/).

| Check | Observed result |
|---|---|
| Backend payment/provider regression | **149 passed, 0 failed, 1 skipped**, using disposable data and provider doubles. Billing/operator source and selected tests match deployed commit `b9e6f005`; the test checkout has unrelated local edits. |
| Hosted browser callback regression | **13 passed**, including expired/wrong/duplicate state, cancellation and existing web import returns. These use synthetic codes, not actual account approval. |
| Public hosted assets | All six content hashes matched; no-store and no-referrer headers verified through public HTTPS. Canonical slash redirect preserves query. |
| Live Google and Discord start | **2 passed**: production PKCE start and redirects reach their official authorization endpoints with state/client ID. No credential, consent or grant-completion step was submitted. |
| Public purchase availability | Shared catalog exposes the USD 4.99 monthly offer; live pricing button advances to billing sign-in. |
| Unauthorized purchase | HTTP **401**, `unauthorized`; no checkout created. |
| Unsigned webhook | HTTP **400**, `bad_signature`; no activation accepted. This does not prove successful signed webhook delivery. |
| Backup | `/var/backups/meldiq/20261103T165505Z`: **317 tables, 688,206 rows**; consistent read-only snapshot, encrypted payload decryption and full dump parsing verified. This backup was not independently restored in this task. |
| Runtime afterward | API, Supabase/PostgreSQL and Redis healthy; same image and data mounts. Release locks released. |
| Windows stable updater | Still **0.2.1**, SHA-256 `25095025281bfbcc8d0f5b8443cd7103fafb78bd5f3d0136303b25c11f556d02`; no new promotion. |

Ingress activation restored its original configuration when initial served-file checks failed. The deployment script now handles worker reload overlap and the slash route explicitly. An initial pre-publication runtime check also restored the previous environment because mount arrays arrived in a different order; comparison now sorts by destination and still requires every mount field to match. The final verification passed. API recreation was required, so this is not a zero-downtime deployment claim.

## Account approval handoff

For Google or Discord, open [Meldiq Web](https://web.meldiq.app/) or the corrected desktop QA app, choose the provider and personally approve sign-in. The hosted native return link completes only the matching pending PKCE flow. Test the actual Windows browser return when the laptop is available.

For PayPal, sign into the intended Meldiq account, open Plus/billing, review **USD 4.99 each month, automatically renewing until cancelled**, and personally authenticate/approve through PayPal. [Website pricing](https://meldiq.app/pricing) also opens the existing account/billing sign-in. No password, OTP or PayPal credential should be sent to this chat. After approval, verify the account-owned checkout, backend payment state, signed webhook event, durable/idempotent processing and entitlements across clients. Cancellation, refund, renewal and failed funding still need actual provider lifecycle evidence; none are inferred from a return URL.

## Windows update blocker

The protected Ed25519 update key created previously authenticates Meldiq metadata and installer hashes. It is not a trusted Windows Authenticode publisher certificate. Repository and `desktop-release` signing secrets were unavailable. Publicly trusted signing requires a certificate/signing-service identity; generating a self-signed certificate does not establish public trust. See [Microsoft's Windows signing options](https://learn.microsoft.com/windows/apps/package-and-deploy/code-signing-options).

The existing certificate-backed workflow expects `WINDOWS_CSC_LINK`, `WINDOWS_CSC_KEY_PASSWORD`, the exact `MELDIQ_SIGNING_PUBLISHER`, and genuine acceptance evidence. Those values must be supplied through protected CI after issuance. No synthetic certificate, fabricated acceptance JSON, disabled signature check or unsigned production installer was substituted. Complete localization and the remaining acceptance checks also remain open; the previous QA report is not a full release certificate.

The shared Windows checkout acquired concurrent outgoing-message changes during this work. Those files were preserved and excluded. Activation sources and receipts are isolated at `/Volumes/code_files/meldiq_windows_release_activation`, branch `codex/windows-production-activation-20261104`. The tested Windows QA artifact remains `0.3.0-readiness.2`; this activation changed its live backend capabilities, not its published installer version.
