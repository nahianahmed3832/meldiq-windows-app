# Dedicated internal QA provisioning checklist

Status: prepared; **no accounts or communities created**. Authorization and actual account values are REQUIRED FROM INFRASTRUCTURE OWNER.

- [ ] Owner records authorization, responsible operator, scope and expiry. Provide actual email addresses privately; do not guess them or use customer accounts.
- [ ] Existing authorized operator opens the real admin console Accounts page (`#/accounts`). Existing mechanism: `POST /admin/v1/accounts`, with `accounts.create`, fresh passkey confirmation and written reason. Do not call it before owner authorization.
- [ ] Provision Desktop QA A as an ordinary account; it may own the private QA community.
- [ ] Provision Desktop QA B as an ordinary account/message receiver.
- [ ] Provision Desktop QA C as an ordinary account; grant moderator permissions only through the private QA community's role editor.
- [ ] Do not select optional console/admin roles, billing grants or global permissions. QA accounts never become platform administrators.
- [ ] Owner chooses existing verification method (`verified`, `static_code` with expiry, or normal `email`). Verify the method fits new-device key-unlock and MFA. Operator-generated password is one-time secret output; store it only in the approved private credential channel/file.
- [ ] Save aliases, user IDs and credentials in the external owner-only acceptance file. Save verification/MFA/key-unlock procedure privately; no permanent bypasses and no credentials in reports.
- [ ] A creates one owner-approved undiscoverable private QA community and private text/call channels. B joins as member; C joins with minimal community moderation role. Verify C has no operator/global rights.
- [ ] Establish a separate A/B DM; C must not have membership, for media access-denial checks. Do not invite real users or enable public discovery, bots, external webhooks or promotions for convenience.
- [ ] Record all object IDs, owners, authorization, UTC run marker, maximum media size and supported cleanup mechanism before running scenarios.
- [ ] Restore reversible profile changes and remove only owned test objects through supported UI/API. Verify abandoned upload/room retention with the owner. Keep accounts until separately authorized lifecycle cleanup.

The actual provisioner is documented in the existing backend's `docs/ADMIN_ACCOUNTS.md`, `server/src/modules/accounts/operatorAccounts.ts` and `server/src/modules/platformAdmin/accountsAdmin.ts`. Use the source matching the deployed API 0.76.1. Older local source is evidence of a mechanism, not authorization or proof that all current operator contracts match.
