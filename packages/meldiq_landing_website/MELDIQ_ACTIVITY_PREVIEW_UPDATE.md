# Activity preview indicator

Published November 1, 2026. Release `site-20261101T023254Z-b458ef7947`.

A labelled simulated activity indicator appears beside “Free to use · Web & Android.” The number is in the requested 200–2,000 range (the generator produces 200–1,999), changes each minute, and moves by at most 17 between adjacent minutes. A deterministic time-based curve keeps visitors and reloads consistent without cookies, storage or network requests. The tooltip explicitly identifies simulated activity rather than a real active-user count. Mobile layout wraps the indicator onto a second line.

Production build, TypeScript, lint and all 34 tests passed. The range, integer, minute-change, year/date/segment-boundary and maximum-delta invariants were checked across 527,040 consecutive minutes. A browser check observed the scheduled change from 1,184 to 1,187 without a page reload. Desktop accessibility reported zero violations; 320px layout showed no horizontal overflow. The deployed indicator was verified on meldiq.app.

The existing website-only deployment script was used. Messaging/API/admin configuration and Docker were not changed. Messaging API, LiveKit and notifications start times and zero restart counts were preserved; messaging web app and admin each returned HTTP 200.

Screenshot: `../meldiq-activity-preview-live.jpg`.

Wording update: published as “<number> people melding now (demo)” in release `site-20261101T023428Z-da32c167b0`. Production build passed and wording was verified live. Screenshot: `../meldiq-people-melding-live.jpg`. Counter logic is unchanged.

Visible-label update: release `site-20261101T023642Z-6d269c687f` displays “<number> people melding now” without the visible demo suffix. The existing tooltip explicitly discloses simulated activity. Production build passed and wording was verified live; counter logic is unchanged.
