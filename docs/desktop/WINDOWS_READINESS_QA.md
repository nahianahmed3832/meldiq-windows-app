# Windows production acceptance — 0.3.0-readiness.1

This is a development remediation build, with sales and production publication gated. No Windows 10/11 physical-device acceptance is inferred from macOS tests or Windows Server CI. Keep the existing public 0.2.1 release/feed unchanged until a new signed release qualifies.

## Automated checks

Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:web`, `npm run icons:check`, `npm run i18n:check`, `npm run verify:snapshot`, `npm run build`, `npm run test:security`, `npm run test:smoke`, `npm run test:readiness`, `npm run test:acceptance-config` and `npm run matrix:check`.

Set `ORBIT_SERVER_DIR` to an existing backend checkout and run `npm run test:integration` and `node scripts/provider-regression.mjs`. Both use disposable local storage/fake provider endpoints and deliberately exclude inherited cloud credentials. These tests must never be described as live PayPal or Discord approval evidence.

`npm run i18n:release` must fail until all locales and audited UI are complete. The normal check validates resource keys/placeholders and prevents counts increasing beyond the reviewed incomplete baseline. Missing text stays absent in resources and falls back to English at lookup; it is never counted as translated. Native menu/dialog/dynamic strings need additional manual coverage beyond the JSX scan.

The Windows CI workflow builds an explicitly UNSIGNED-DEV installer, inspects actual executable icon pixels and manifest, verifies quoted HKCU protocol registration/Start Menu target, and performs actual install/launch/uninstall. CI artifacts are development QA only. The 30-second idle benchmark is a Windows Server VM measurement, not a laptop recommendation.

## Hosted browser handoff deployment

The desktop bundle cannot update files served in a user's system browser. Merge the reviewed changes into the owning web deployment, preserving its newer unrelated work:

- Add `public/desktop-bridge.html`, `desktop-bridge.js`, and `desktop-bridge.json`.
- Merge the small changes to `public/social-auth-callback.js` and `src/application/discordReturn.ts`.
- Deploy the web application's normal tested static export. `/discord/callback` must continue serving its existing client entry point, and `/social-auth-callback.html` must remain available.
- Serve handoff/callback HTML and JSON with `Cache-Control: no-store` and `Referrer-Policy: no-referrer`; permit only same-origin scripts with the existing CSP. Exclude callback URLs/query values from access logs. Do not change provider secrets or redirect registrations merely to deploy these files.
- Publish the capability JSON last after both entry/return paths are verified. The desktop discovers exact version 1 over HTTPS; a missing/HTML/redirected capability response leaves legacy social callbacks in place and gives an explicit Discord deployment error.
- Google/Discord social sign-in keeps the current server registered callback `/v2/auth/social/callback`; the bridge uses the existing `web` platform contract. Discord import keeps the registered `https://web.meldiq.app/discord/callback`. No new OAuth client secret belongs in the Windows app.

The browser stores only the expected flow ID/state and deadline in sessionStorage, then scrubs callback credentials from the address. A visible Open Meldiq link handles browsers that block automatic custom-scheme redirects. Electron accepts only a matching, pending, unexpired result. The original verifier stays in the initiating renderer and the backend validates S256 PKCE/single-use receipts. Closing/restarting the app during authorization loses the pending verifier and requires a new sign-in; no callback creates an unsolicited session. This remains a cold-restart recovery limitation.

## Windows 10 and Windows 11 manual matrix

Run separately on supported Windows 10 and Windows 11 machines, using a standard Windows account. Record OS build, app version/commit, result, timestamp and redacted evidence for every case:

| Area | Cases | Acceptance |
| --- | --- | --- |
| Install | Fresh install, upgrade from 0.2.1, uninstall/reinstall, reboot, update | No normal-launch elevation; executable/installer/uninstaller/desktop/Start Menu/search/taskbar/tray/Installed Apps/notification icon is original Meldiq. Preserve an existing test session and messages. Verify old icon-cache refresh after upgrade; do not delete user data or system caches as a workaround. |
| Callback | Default-browser Google/Discord sign-in, already-running app, canceled browser, denied consent, expired result, wrong/replayed state, unregistered protocol/reinstall | Correct session/account and foreground window; one main instance; no tokens in callback URLs. Browser handoff unavailable produces an actionable error. Restarted in-progress authorization must offer retry; current build cannot recover its lost verifier. |
| Discord import | Managed test guild with bot consent; unauthorized user; roles/channels/categories/icon/emoji preview; excluded content; start/progress/partial failure/retry | Real backend results, only granted visible structure, retry creates no duplicate items. Cancellation applies before connection; the backend currently has no running-import cancellation API. Closing progress does not cancel its server job. |
| Devices | Microphone/camera/speaker allow/deny/reset; relaunch; OS privacy denial; USB hotplug; device switching; screen-share cancel/timeout/display selection | No prompt at ordinary launch; stored per-device decisions respected; OS security retained; each screen share still requires explicit source selection. |
| Daily use | DM/community/workspace; small/large authorized upload/download; drag/drop; clipboard; notifications; tray; startup toggle; keyboard/focus; calls/background/network interruption | Same central backend behavior and entitlements as shipped web/Android. No update/restart while calls/transfers/payment window are busy. |
| Windows UX | Minimize/maximize/restore/close, unplugged monitor, negative monitor coordinates, 100–250% DPI, taskbar work area | Visible restored normal bounds on the correct monitor; maximized preference retained; usable focus/text/controls. |
| Language | Search/select all requested locales; restart; system-language preference; Arabic/Urdu; mixed-language user messages; long strings | UI updates and persists without altering user content. Full translations, fonts, native dialogs/menus and layout need review; partial fallback is not release acceptance. |
| Performance | Cold and warm startup; 30-second idle; active chat; upload; audio/video/share; reconnect; long session | Record measured time, RSS/working set, CPU, freezes/leaks and hardware. No universal claims from a single VM/Mac result. |

## Direct production PayPal buyer acceptance

The owner requested production PayPal rather than sandbox. A real consenting buyer (the owner's brother may use his Windows laptop) must personally authenticate and approve the purchase. Never handle his PayPal password, disable approval, infer payment from a redirect, or enable public sales simply to make a test button work.

The read-only production catalog on 2026-11-03 reports Free and Plus, monthly list price USD 4.99, `onSale.mode=live`, `onSale.plus=null`, and all Plus terms unavailable. Identify and validate the merchant subscription plan/capability configuration through the existing backend owner flow. Public sales remain disabled until the release gates pass. Existing Sparks/Bots+ flags are separate products and were not changed.

Record one agreed account-owned monthly checkout ID, actual quoted price and renewal terms, buyer approval, backend capture/payment state, verified webhook signature result and durable event ID, then compare Windows/web/Android Plus entitlements. Exercise cancellation, browser closure, refresh/retry without duplicate charges, rejected signature, replay/idempotency, and authorization boundaries. Refund/renewal/failed-funding evidence must come from the actual supported backend/provider lifecycle; any real refund needs owner authorization for that QA transaction. Redact personal/provider credentials. Do not mark future renewal/payment-failure cases passed before evidence exists.

## Signed release

Supply a valid publisher signing certificate through protected release CI, exact publisher identity, a clean source commit and `RELEASE_ACCEPTANCE.json` for that commit. Added evidence gates cover browser return, Discord, verified live PayPal/webhook/failure handling, localization, Windows 10, Windows 11, upgrade branding and standard-user behavior alongside existing gates. Private Ed25519 update signing is not an Authenticode certificate. The old unsigned private publication helper is disabled for new releases under this request. Existing installed updater verification and existing published artifacts are preserved.

Do not publish or promote the development installer. Build the production installer through `npm run package:win` on Windows, verify every executable with `scripts/verify-windows-signatures.ps1`, then repeat install/upgrade/update acceptance using that exact signed artifact before any production publication.
