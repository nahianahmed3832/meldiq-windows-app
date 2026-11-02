# Feature parity matrix

The complete module ledger is WEB_FEATURE_INVENTORY.md and feature-inventory.json. Each row is packaged-source coverage only until its workflow passes authenticated desktop acceptance.

| Category | Existing implementation | Desktop verification |
|---|---|---|
| Authentication, social providers, MFA, passkeys, multi-account | src/auth; ui/auth; ui/settings/Account* | Pending authenticated Windows acceptance |
| Profiles, free customization and inventory | sync/profile; sync/decorations; ui/people; ui/settings/Profile* | Pending authenticated Windows acceptance |
| Messaging, encryption, history, reactions, polls, threads | sync; protocol; crypto; ui/chat | Pending authenticated Windows acceptance |
| Communities, roles, bots, moderation, lobby | ui/workspace; ui/community; ui/lobby | Pending authenticated Windows acceptance |
| Media, transfers, quotas and file handling | sync/attachments; sync/largeUpload; sync/transfers; ui/chat | Pending authenticated Windows acceptance |
| Calls and screen sharing | call; ui/call; native capture adapter | Pending authenticated Windows acceptance |
| Notifications and activity | application/boot; application/webPush; ui/views/ActivityView | Pending authenticated Windows acceptance |
| Search and discovery | sync/universalSearch; ui/discovery; ui/dialogs | Pending authenticated Windows acceptance |
| Plus, Spark, gifts, payments and billing | sync/mojo; ui/mojo; ui/billing | Pending authenticated Windows acceptance |
| Settings, accessibility, language, security and sessions | application/prefs; i18n; ui/settings | Pending authenticated Windows acceptance |
| Points, quests, leaderboards, creators and developer tools | ui/points; ui/leaderboards; ui/creators; ui/developer | Pending authenticated Windows acceptance |

Verified feature parity percentage: **not yet measurable**. A narrow real-backend macOS acceptance passed email/password enrollment, OS-sealed reload restoration and bidirectional direct messaging. The full per-feature and Windows acceptance matrix remains pending; source inclusion is not functional verification. This is not a release-ready declaration.
