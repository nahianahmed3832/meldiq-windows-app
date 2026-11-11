# Meldiq website design system

Implemented November 1, 2026 in the existing public website.

## Direction

A friendly after-hours community space: charcoal canvas, mint/cyan actions, lilac display accents, occasional peach and pink, rounded geometry, expressive type and carefully composed community illustrations. Existing Meldling proportions and artwork are preserved. Product compositions are explicitly labelled illustrative; they contain no functional chat controls or invented testimonials.

## Tokens

| Token | Value | Purpose |
| --- | --- | --- |
| `--bg` | `#10101b` | Main canvas |
| `--surface` | `#181825` | Raised surfaces |
| `--surface-2` | `#202030` | Illustration panels |
| `--line` | `#2b2b3e` | Dividers |
| `--text` | `#f5f4fc` | Headings/body emphasis |
| `--muted` | `#b3b1c8` | Supporting copy |
| `--cyan` | `#8dece0` | Primary actions/privacy highlights |
| `--violet` | `#bca4fb` | Brand emphasis |
| `--pink` | `#f6a6c5` | Select details |
| `--orange` | `#f4bd93` | Select details |
| `--radius` | `24px` | Large containers |

Typography uses the original self-hosted variable Plus Jakarta Sans font (200–800). Major headings use tight tracking and fluid sizes; reading copy is 13–15px with generous line height. Tiny text belongs only to decorative, labelled product illustrations. No external font services or third-party runtime scripts were added.

## Components

- `Layout.tsx`: shared metadata, sticky header, signed-in state, active links, mobile menu, skip link, WebSite microdata and footer.
- `MarketingFooter.tsx`: full product/account/legal navigation and mascot detail.
- `MarketingArt.tsx`: reusable product preview, privacy story, voice preview and final CTA.
- `MarketingStatus.tsx`: API-driven Mojo availability, catalog status and verified support/privacy contacts.
- `PreviewPlanCard.tsx`: non-purchase plan previews, configured benefits, and existing trial links.
- `MojoCompare.tsx`: live comparison table, keyboard-scroll region and Spark levels.
- `LegalPage.tsx`: existing policy renderer, tables of contents, draft notice, dynamic legal details, restyled for reading.
- `faq.tsx` + `content/faq.json`: search, category filters, native keyboard-operable details and dynamic offer answers.
- Download and support pages use shared button, panel, platform, icon and heading treatments.

Existing account forms, API/session libraries and checkout dialog remain intact. New styling is scoped under `.marketing-site`; compatibility rules align legacy account/legal presentation without changing their behavior.

## Responsive rules

Main breakpoints: 1100, 820, 640 and 360px, with a large-screen adjustment above 1500px. The hero stacks, mobile navigation replaces desktop links below 640px, editorial sections become single-column, pricing cards stack, comparison tables scroll inside their own labelled keyboard-accessible region, and legal contents move above the document. Available-platform links remain distinct from non-interactive coming-soon labels.

## Interaction/accessibility

Visible focus outlines, keyboard navigation, Escape dismissal with focus return, click-outside menu closing, accessible search labels, live result count, pressed category states, semantic headings, native details and meaningful image alternatives. CSS honors reduced motion. Hover effects use small transforms and color changes. Inline prose links are underlined. Decorative gradients and orbits do not carry essential meaning.

## Assets

Original Meldling PNGs and local font; official locally stored Google Play badge; original CSS/SVG product compositions; new 1200×630 branded `public/meldiq-og.png`. No stock photography, fabricated numbers or customer quotes.
