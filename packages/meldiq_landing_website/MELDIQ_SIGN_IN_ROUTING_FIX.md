# Meldiq sign-in routing correction

Published November 1, 2026, approximately 02:21 Asia/Shanghai.

The website’s general Sign in link previously opened the account/billing form at `/login`. That form does not perform the messaging app’s email-code step for unlocking encrypted messaging on a new browser. It supports password authentication, existing authenticator/backup-code checks, and local account/billing sessions.

This update routes signed-out public-header Sign in and the footer’s Sign in to Meldiq link to the existing application at `https://web.meldiq.app`. The separate `/login` page now explicitly says Account & billing sign-in and offers a prominent Sign in to Meldiq link. Its authenticator-code hint clarifies that an email is not sent for that step.

This is a website navigation/copy correction, not a new email OTP system or a change to authentication security. The account login submit logic is byte-for-byte unchanged. No new OTP endpoint, secret retrieval, encryption-key operation or client-only authentication check was introduced. The messaging app’s existing flow remains responsible for its own email delivery and verification.

Validation: typecheck, lint, 32 unit tests and production build pass. All 11 exported public headers point to the existing messaging app; billing destinations remain intact. The live homepage link and the clarified live `/login` page were verified in browser. No email was requested using the owner’s credentials, so end-to-end delivery to the owner’s mailbox has not been tested here.

Release: `site-20261031T182119Z-e14bc8a072`; previous website release: `site-20261031T180015Z-1b01bd6e04`.

Deployment used the existing website-only release script without nginx configuration replacement. Docker containers, messaging API, web app, core-admin, database and payment configuration were not changed. Messaging containers remained running with their previous start times and zero restarts.
