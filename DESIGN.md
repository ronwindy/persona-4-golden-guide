# Persona 4 Golden Guide — Design (`DESIGN.md`)

Visual decisions for the guide site. Agent behaviour rules (no monospace, don't copy Shadow Hearts/Limbo, ask before new ornaments, `GuideImage` for images) live in [`CLAUDE.md`](CLAUDE.md) §3. Record new design decisions here, not in CLAUDE.md. Decisions are recorded only after the user makes them.

## Decided
- **Theme:** P4 yellow & TV-world. Dark only.
- **Palette:** dark warm base `#0d0d0d`, P4 yellow `#FFE600` accent, off-white text. Red = warnings, cyan = links/info.
- **Fonts:** Jost (body), Dela Gothic One (h1/h2/h3, sidebar drawer head), Sriracha (slot labels and step titles, single weight), from Google Fonts.
- **Headers:** h1/h2 are black text on a skewed yellow slab with a hard offset shadow. h3 is plain yellow.
- **Header rule:** every h1/h2 has a full-content-width skewed rule below it: a 3px yellow bar fading to transparent over a 1px hairline (`::after`, width `100cqw` of `.content`).
- **Motifs (CSS only):** skewed/angled panels, fog/gradient backdrop, faint static scanlines.
- **Panels:** frosted dark glass on every panel (tables): `backdrop-filter` blur, ~55% dark tint, thin light edge with a top sheen, 10px radius. Tokens: `--glass-*`.
- **Tokens:** all values live in the `:root` tokens of `src/styles/global.css`. Tailwind utilities read them via `@theme inline`.
- **Stack:** Tailwind 4 (`@tailwindcss/vite`) and `@lucide/astro` icons.
- **Layout:** left sidebar and content on desktop, drawer on mobile. The source's own markup is restyled only (h2 = small slab label, h3 = page title, tables in glass panels).
- **Progress:** sidebar shows read count, bar and a check per read page; "Mark as read" button per page; "Continue reading" link. Browser localStorage only.
- **Icons:** Lucide icons in the sidebar only (`src/lib/nav-icon-rules.mjs`).

## Open (ask the user when the source needs them)
Logo/branding, home page, badge styles, dark-mode details beyond the base theme, gamepad support, boss/shop/game-specific blocks, and any ornament beyond the motifs above.
