# Persona 4 Golden Guide — Design (`DESIGN.md`)

Visual decisions for the guide site. Agent behaviour rules (no monospace, don't copy Shadow Hearts/Limbo, ask before new ornaments, `GuideImage` for images) live in [`CLAUDE.md`](CLAUDE.md) §3. Record new design decisions here, not in CLAUDE.md. Decisions are recorded only after the user makes them.

## Decided
- **Theme:** P4 yellow & TV-world. Dark only.
- **Palette:** dark warm base `#0d0d0d`, P4 yellow `#FFE600` accent, off-white text. Red = warnings, cyan = links/info.
- **Fonts:** Jost (body), Dela Gothic One (h1/h2/h3, sidebar drawer head), Kanit 800 italic (slot labels, step titles, h4, h5 label markers; replaces Barlow Condensed), from Google Fonts.
- **Headers:** h1/h2 are black text on a skewed yellow slab with a hard offset shadow. h3 is plain yellow.
- **Header rule:** every h1/h2 has a full-content-width skewed rule below it: a 3px yellow bar fading to transparent over a 1px hairline (`::after`, width `100cqw` of `.content`).
- **Motifs (CSS only):** skewed/angled panels, fog/gradient backdrop, faint static scanlines.
- **Panels:** frosted dark glass on every panel (tables): `backdrop-filter` blur, ~55% dark tint, thin light edge with a top sheen, 10px radius. Tokens: `--glass-*`.
- **Callouts:** blockquotes are tiered by their bold heading (class set in the page HTML). HIGHLY IMPORTANT = strongest red glass panel with glow; IMPORTANT / WARNING = red glass panel; SPOILERS = same panel in amber; NOTE and others keep the plain yellow-bar quote.
- **Tokens:** all values live in the `:root` tokens of `src/styles/global.css`.
- **Stack:** plain CSS and `@lucide/astro` icons.
- **Layout:** left sidebar and content on desktop, drawer on mobile. The source's own markup is restyled only (h2 = small slab label, h3 = page title, tables in glass panels).
- **Progress:** sidebar shows read count, bar and a check per read page; "Mark as read" button per page; "Continue reading" link. Browser localStorage only.
- **Page ToC:** pages with 6+ h4 headings get an "On this page" list of those h4s (ids are in the page HTML, entries stored in `manifest.json`). From 1280px up it is a sticky right column (own scroll, scroll-spy marks the current entry); below that it is a collapsible block above the text, closed by default. Quiet style: Dela Gothic One uppercase head, Kanit italic entries, thin left bar, yellow bar and text on the active entry. Styles in `src/styles/page-toc.css`.
- **Emphasis:** guide terms (items, personas, skills, arcana, shadows/bosses, places, characters) are bold, one style for all (`strong.term`, orange `--term` #ffb347, weight 700; the yellow `strong` stays for the source's own labels). Every occurrence on all pages except the appendix pages (Item List, Persona Compendium, Skill List); terms come from the guide's own appendix tables and page titles, matched case-sensitively. Besides the known terms, every capitalized word or run the author wrote mid-sentence is bold too (runs continue through of/the/and/in/to/a; the first word of a sentence, bullet or cell is bold only inside a multi-word run; nothing is excluded, so I, A/B/C, UP, months and weekdays are bold). Double-quoted spans, quote marks included, are italic (`em`, cyan `--emph` #9fe3ff; a term inside a quote keeps the term colour). Nothing else is italic.
- **Icons:** Lucide icons in the sidebar only (`src/lib/nav-icon-rules.mjs`).

## Open (ask the user when the source needs them)
Logo/branding, home page, badge styles, dark-mode details beyond the base theme, gamepad support, boss/shop/game-specific blocks, and any ornament beyond the motifs above.
