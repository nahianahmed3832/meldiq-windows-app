# Production acceptance environment

Status: **blocked for authenticated production acceptance and public beta**. Inspected 2026-11-03 Asia/Shanghai using read-only deployment inspection, public HTTP requests and the existing development Electron build. No account, payment, deployment, DNS or infrastructure change was made.

## Confirmed configuration and evidence

| Service | Confirmed value | Evidence and limit |
|---|---|---|
| Desktop API | `https://web.meldiq.app` with existing `/v1/` and `/v2/` contracts | Existing `config/desktop.json`; actual Electron public requests return 200. No client host override was used. |
| Realtime | `wss://web.meldiq.app/v1/ws` | Existing Electron opens the unauthenticated handshake. Authenticated event delivery still requires QA accounts. |
| Separate public API ingress | `https://msg.meldiq.app` | Public `/healthz` and `/v1/server-info` return 200. This is the existing deployment's ingress, not an approved workaround for web access restrictions. |
| Backend | API `0.76.1`; container image `griip-internal-messaging-api:0.76.1-plus-708353fe` | Read-only Docker inspection and health; healthy, zero restarts at inspection. Local media-release checkout is older and is not the deployed source. |
| Database | `DATABASE_MODE=atlas`; MongoDB and Redis health true | Existing production runtime and `/healthz`. No database credentials, records or collections were read by this task. Desktop has no database credentials. |
| Binary media | Existing S3 bucket `griipbuddy-orbit-media-sg`, region `ap-southeast-1`; observed host `https://griipbuddy-orbit-media-sg.s3.ap-southeast-1.amazonaws.com` | Existing runtime and nginx media allowlist. No object was uploaded/read/listed. Signed URLs must come from backend authorization. |
| LiveKit | `wss://rtc.meldiq.app`; HTTPS host answers 200 | Existing `LIVEKIT_PUBLIC_URL` and nginx. Connectivity of a real media session, TURN/ICE paths and device behavior remain unverified. |
| Social authentication | Google and Discord; authorize/web origin `https://web.meldiq.app`; existing Supabase auth service | Public provider contract and selected non-secret runtime configuration. Provider console callback registrations and actual desktop returns remain unverified. |
| Billing | PayPal, environment `live`; public plans `mode=live`, available true | Existing runtime and public plans. Stripe secret is not configured in the inspected runtime. No checkout, purchase, portal or subscription mutation was requested. |
| Notifications/email | FCM project `meldiq` with backend-only credential file; mail transport SMTP; existing ntfy service in deployment | Runtime field presence and deployment compose. Actual desktop background delivery is not verified. Backend credential contents were not read. |
| Operator provisioning | Existing admin console Accounts page; `/admin/v1/accounts` | Existing `docs/ADMIN_ACCOUNTS.md` and account admin implementation. Owner authorization is required before provisioning. |

Evidence: [public desktop probe](evidence/production-desktop-public.json), [public contract probe](evidence/production-public-contracts.json), [sanitized infrastructure receipt](evidence/production-infrastructure.json). Public probes contain no tokens, arbitrary response bodies or signed links.

## Connection origins and approval

Existing app document origin is `https://web.meldiq.app`. Its packaged API proxy uses that same origin; the WebSocket is on the corresponding `wss` origin. The inspected API has no `WEB_ORIGINS` value, and the cross-origin OPTIONS probe returns 404 without CORS headers. Same-origin Electron API requests and its WebSocket handshake work. Do not infer cross-origin approval from those results.

The desktop initially had an empty `connectOrigins` array. Read-only inspection of the actual deployed website CSP confirmed that all three exact origins are already allowed: the S3 HTTPS origin above, `wss://rtc.meldiq.app` and `https://rtc.meldiq.app`. The desktop configuration now includes these three existing production-policy origins; see [origin-policy evidence](evidence/production-origin-policy.json). PayPal hosts already have explicit existing policies. Do not add wildcards, an arbitrary token-returned host, or Supabase directly to renderer connections to make an error disappear. Social authorization runs in the system browser through the existing backend.

**Approved additional connection origins:** the three exact hosts above are confirmed from the existing deployed web policy. Any additional upload/CDN variant, LiveKit ICE/TURN requirements and authenticated backend WebSocket policy are **REQUIRED FROM INFRASTRUCTURE OWNER** or actual authorized scenario evidence. The restricted API profile could not read CORS; subsequent read-only inspection using the existing operator profile confirmed GET/HEAD/PUT from `https://web.meldiq.app` and `https://admin.meldiq.app`. Allowed headers include content/range/conditional headers and `x-amz-*`; ETag, checksums and range/length headers are exposed. No permissions were expanded. See [actual S3 policy](evidence/production-s3-policy.json). Signed transfers and actual packet paths must confirm any additional hosts before further CSP changes. Only the desktop's explicit connection list was matched to the existing production web policy. No backend allowlist, CORS rule or provider setting was changed. The external origins-approval gate stays false until cross-service acceptance is verified.

## External acceptance configuration

Local macOS path:

`/Users/nahian/Library/Application Support/Meldiq/desktop-acceptance.env`

Created with owner-only permissions using the safe [example](../../config/desktop-acceptance.env.example); QA credentials/IDs remain empty and authorization/approval remain false. Existing files are preserved. Repository ignore rules include the requested literal path and accidental in-repository filenames. The actual file is outside the Git checkout and cannot be tracked by this repository.

The harness parses data from an explicit absolute `--env` path. It rejects files in the checkout, broad Unix permissions, unknown or duplicate fields, URL credentials, insecure origins and live transaction mode. It never sources a shell file or assigns acceptance values to `process.env`. Passwords with special characters can use a JSON-quoted string on one line. No AWS, LiveKit, payment-provider or admin permanent secrets belong in this file.

```sh
npm run test:acceptance-config
npm run acceptance:preflight -- --env '/Users/nahian/Library/Application Support/Meldiq/desktop-acceptance.env'
npm run acceptance:discover -- --env '/Users/nahian/Library/Application Support/Meldiq/desktop-acceptance.env'
npm run acceptance:desktop -- --env '/Users/nahian/Library/Application Support/Meldiq/desktop-acceptance.env'
```

Preflight/discovery exit 2 when setup is incomplete; passing public contracts alone never makes production acceptance pass. Results go under ignored `test-results/`. Discovery calls only fixed public GET contracts and an OPTIONS preflight. The desktop probe launches the existing build in a disposable profile, calls public contracts and opens then closes an unauthenticated WebSocket. It passes no acceptance configuration into the renderer or Electron environment and never changes targets to bypass a failure. Packaged-code checks reject acceptance-field markers.

The existing `npm run test:integration` is separate: it requires `ORBIT_SERVER_DIR` pointing to an existing local backend, starts it with a sanitized environment, disposable SQLite/file-mail storage and loopback binding, then tests real sign-in/enrollment, sealed reload restoration and bidirectional encrypted messaging with the backend reference client. It never consumes this production acceptance file or cloud credentials. It is not production or shipped Android/web acceptance.

## Dedicated accounts and private QA structure

Follow [QA_ACCOUNT_PROVISIONING.md](QA_ACCOUNT_PROVISIONING.md). An already authorized operator must use the actual Accounts console only after the owner supplies authorization and actual addresses. A is a standard member/owner of the private QA community, B an ordinary member/receiver, C a moderator scoped only to that community. None receives an operator/global administrator role. Select an approved verification method, distribute credentials privately and record internal ownership and expiry.

Create one undiscoverable private community and approved private text/call rooms owned by A. Use a separate A-to-B DM for the C non-member media-access test. Record IDs and cleanup mechanisms in the external configuration/run ledger. Use a marker such as `desktop-qa-<UTC run ID>` in newly authorized object names/content; never rename or delete unrelated objects. No object creation has been performed by this task.

## S3 acceptance procedure

1. Confirm owner approval and QA A/B/C identities, approved origins and the existing backend file/quota policy. Record run owner, intended objects, maximum bytes and cleanup plan before creating anything.
2. Use existing desktop attachment UI and backend authorization. Source contracts include `POST /v1/attachments`, `POST /v1/attachments/uploads`, per-upload URL/parts/complete routes and authenticated `GET /v1/attachments/:id`. Never use AWS credentials in desktop or bypass conversation membership.
3. Start with an identifiable 1 KiB text file and a small valid image, each at most 1 MiB. Hash plaintext locally, send encrypted bytes, receive/decrypt as B and compare SHA-256. Repeat with the actual web/Android peer. Never log attachment keys, auth headers or signed URL query strings.
4. Record authorized upload/download statuses, URL expiry duration without the URL/token, content/range handling, and denial as C for the A/B DM attachment. An expired link must fail; a fresh link requires backend authorization. Do not modify ACLs/CORS or make the bucket public.
5. Exercise cancellation, retry and a brief interruption on QA transfers only. Verify the backend's upload cancellation/abandonment behavior and release local blob URLs/media tracks. Check disk/cache usage and that clearing temporary media retains account/session/key data.
6. Quota exhaustion, very large sizes, corruption fixtures and destructive negative cases run on an isolated deployment with deliberately small test quotas, not by filling production storage. The complete file-size/load matrix remains blocked until that deployment and storage budget are supplied.
7. Remove only run-owned messages/media through their supported UI/API. Confirm whether deleting a message releases a stored attachment immediately or via backend retention/garbage collection; never claim immediate S3 deletion without evidence. Existing S3 lifecycle aborts incomplete multipart uploads after one day, expires noncurrent versions after 30 days and removes expired delete markers. It does not impose a general current-object expiry. Public API configuration advertises attachment TTL 604800 seconds and keep duration 365 days; these are configuration, not proof that a QA object was deleted. Exact application garbage-collection timing and QA cleanup confirmation remain REQUIRED FROM INFRASTRUCTURE OWNER.

## LiveKit and screen-sharing procedure

Use the existing backend call flow between A/B and its short-lived room grants. Never embed API keys/secrets or create unrestricted room tokens. Record room ownership, participant scope, grant expiry interval and cleanup before joining. Verify audio/video in both directions, receiving on a shipped Windows/web/Android peer, camera/microphone denial or absence, output selection, device hotplug, device switching and reconnection. Test a quiet QA room, not a real user's call.

Verify token expiry by attempting a fresh join with an expired QA grant without exposing it; distinguish existing-session behavior from new-join behavior. Share an explicitly selected window containing QA-only material, verify it at B, stop sharing/hang up and confirm all tracks/capture indicators end. Repeat network interruption and sleep/wake on physical Windows. Record connectivity/ICE transport without credential-bearing URLs. Actual expired-token, media, reconnect and capture acceptance remains blocked; a healthy LiveKit host or unit test does not pass it.

## Payments and entitlement safety

Production is live PayPal. Production acceptance permits read-only plans/entitlements and viewing existing UI. Do not click actions that create checkout/orders/portal sessions, authorize payments, create gifts, modify subscriptions or redeem rewards. No fake card may be entered into live checkout.

Transaction acceptance requires a **separate isolated backend deployment**, isolated database/media resources, its actual provider test credentials and signed webhook endpoint. Use Stripe test mode or PayPal Sandbox as configured by the owner; never replace global production credentials. Backend configuration exposes provider mode, and acceptance must fail if mode is live or the sandbox API is the production origin. Use existing server catalog/entitlement rules without changing prices or granting benefits. Test success/cancel/renewal/expiry/replay/refund/gift transitions only there and capture redacted evidence. Historical sandbox reports in other repositories are not acceptance of this desktop artifact.

Isolated sandbox origin, owner, provider mode, webhook setup and approved buyer/seller accounts: **REQUIRED FROM INFRASTRUCTURE OWNER**. Live checkout configuration verification and sandbox transaction verification must have separate evidence records.

## Production data and cleanup rules

Controlled production activity requires specifically authorized QA accounts/objects. Only reversible profile changes, controlled DMs/private QA posts, small identifiable files, test rooms and read-only entitlement checks are in scope. Account provisioning itself awaits owner authorization. No public posts, broad cleanup, account deletion, destructive moderation, mass notifications or real financial transactions.

Maintain a private run ledger with UTC run ID, operator, authorization reference, test artifact/build/commit, account aliases/IDs, private object IDs, owner, bytes, expected retention, cleanup operation and verified result. Credentials, content keys and signed links are excluded. Restore prior profile values; remove only QA-owned messages/uploads through supported workflows; leave rooms, stop tracks, revoke only authorized temporary QA device sessions and clear the disposable local profile. The operator retains the QA accounts for future runs unless separately authorized to remove them. Escalate orphan cleanup with exact IDs rather than issuing database-wide deletes.

## Exact outstanding inputs

Every item below is **REQUIRED FROM INFRASTRUCTURE OWNER**:

- `MELDIQ_ACCEPTANCE_OWNER_REFERENCE`, actual authorization for account provisioning and controlled QA operations, operator/run owner and expiration.
- Actual A/B/C email addresses, private passwords, account/user IDs, approved verification/MFA/key-unlock method. Never paste them into chat or commit them.
- `MELDIQ_ACCEPTANCE_QA_COMMUNITY_ID`, `MELDIQ_ACCEPTANCE_QA_CHANNEL_ID`, approved private DM/call structure and role scope; create through existing mechanisms only after authorization.
- Actual transfer evidence under the confirmed S3 CORS rules, any additional upload/CDN origins, LiveKit ICE/TURN and authenticated backend origin policy (the existing exact desktop CSP hosts are confirmed); only then set `MELDIQ_ACCEPTANCE_ORIGINS_APPROVED=true`.
- Owner authorization before `MELDIQ_ACCEPTANCE_QA_AUTHORIZED=true`; the current harness does not perform authenticated mutations even when this flag is true.
- `MELDIQ_ACCEPTANCE_SANDBOX_API_ORIGIN`, `MELDIQ_ACCEPTANCE_SANDBOX_ISOLATED=true`, `MELDIQ_ACCEPTANCE_PAYMENT_MODE=test` or `sandbox`, actual sandbox account/verification procedure and isolated webhooks. Provider secrets stay on that backend.
- Current deployed backend source/contract artifact for API 0.76.1, actual application cleanup/retention verification and small/large upload test budget, provider callback registrations and notification delivery procedure.
- Acquire a trusted signing mechanism and physical device access; neither exists yet according to the owner. See [WEBSITE_DISTRIBUTION.md](WEBSITE_DISTRIBUTION.md) for concrete next steps. Exact validated publisher, protected CI, signed-update promotion authority and release evidence remain required.
- Physical Windows 4/8/16 GB hosts, actual Android/web test peer and camera/microphone/screen-sharing access. No Android device was connected at inspection.

See [BACKEND_COMPATIBILITY_REPORT.md](BACKEND_COMPATIBILITY_REPORT.md), [PRODUCTION_SECURITY_REPORT.md](PRODUCTION_SECURITY_REPORT.md), [PRODUCTION_READINESS_CHECKLIST.md](PRODUCTION_READINESS_CHECKLIST.md) and the [functional workflow matrix](FEATURE_PARITY_MATRIX.md). The earlier 403 was classified as Cloudflare 1010 browser-signature filtering of urllib; actual macOS and Windows Electron public requests pass without access-control changes. See the backend report and redacted edge evidence. Production readiness is not claimed.
