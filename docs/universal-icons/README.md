Meldiq Desktop 0.3.1 consumes the canonical Meldiq Web semantic catalogue (`shared/icons/catalogue.json`) through its bundled React renderer. The pinned mirror lives in `packages/web/shared/icons`; `npm run icons:universal-check` checks every source and adapter digest and bundled notices. Update this mirror using the canonical web `scripts/icons/generate.py --desktop /path/to/desktop` command.

The pilot replaces settings symbols and Home/Messages/Activity tab glyphs. User avatars, rank medals, Ember artwork, native menus, tray icon, launcher assets, window controls, routing, badges and native integration remain intact. There is no additional runtime dependency and no icon network request. The bounded adapter includes 33 selected shapes. Lucide's ISC and inherited Feather MIT notices ship locally in `packages/web/public/icon-licenses.txt`.

The permanent skill is `.agents/skills/meldiq-universal-icons/SKILL.md`. Remaining screens will migrate gradually by semantic purpose, with matching Android vectors. Brand assets need official owner provenance and guidelines before migration; no additional collection or third-party brand asset is introduced here.

Validation and production publication receipts are recorded after the Windows candidate/qualification runs. Native CI proves the tested installer/update scenarios; physical Windows acceptance remains separate.
